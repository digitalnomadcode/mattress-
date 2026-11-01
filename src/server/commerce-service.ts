import { orderInput, transitionInput, stockInput, returnInput, allocationInput, countInput, type Status } from "@/lib/commerce";
import { operation, warehouseLock, type Tx } from "./operations";
import { BusinessError } from "./errors";

async function assertActor(tx: Tx, actorId: string, financial = false) {
  const actor=await tx.adminUser.findUnique({where:{id:actorId}});
  if(!actor || actor.disabled || (financial && actor.role==="WAREHOUSE")) throw new BusinessError("FORBIDDEN",403);
  return actor;
}

export async function createOrder(raw: unknown, key: string) {
  const input=orderInput.parse(raw);
  return operation("CREATE_ORDER",key,input,async tx=>{
    const items=[];
    for(const request of input.items.sort((a,b)=>a.sku.localeCompare(b.sku))) {
      const variant=await tx.productVariant.findUnique({where:{sku:request.sku},include:{product:true,balance:true}});
      if(!variant?.active || !variant.product.published || !variant.priceKzt) throw new BusinessError("PRODUCT_UNAVAILABLE",409);
      if(!variant.balance || variant.balance.onHand-variant.balance.reserved<request.quantity) throw new BusinessError("INSUFFICIENT_STOCK",409);
      items.push({ variantId:variant.id, skuSnapshot:variant.sku, titleSnapshot:`${variant.product.brand} ${variant.product.name}`, unitPriceKzt:variant.priceKzt, quantity:request.quantity });
    }
    const customer=await tx.customer.upsert({where:{phone:input.phone},create:{phone:input.phone,name:input.customerName},update:{name:input.customerName}});
    const order=await tx.order.create({data:{submissionKey:key,customerId:customer.id,customerName:input.customerName,customerPhone:input.phone,
      deliveryMethod:input.deliveryMethod,deliveryAddress:`${input.city==="ALMATY"?"Алматы":"Астана"}${input.address ? `: ${input.address}` : ""}`,note:input.note,items:{create:items}}});
    await tx.outboxEvent.create({data:{type:"order.created",payload:{orderId:order.id}}});
    return {id:order.id,number:order.number,totalKzt:items.reduce((s,i)=>s+i.unitPriceKzt*i.quantity,0),items:items.map(i=>({sku:i.skuSnapshot,title:i.titleSnapshot,quantity:i.quantity,unitPriceKzt:i.unitPriceKzt}))};
  });
}

const allowed: Record<Status, Status[]> = {NEW:["CONFIRMED","CANCELLED"],CONFIRMED:["PROCESSING","DELIVERED","CANCELLED"],PROCESSING:["DELIVERED","CANCELLED"],DELIVERED:[],CANCELLED:[]};

export async function transitionOrder(raw:unknown,key:string,actorId:string) {
  const input=transitionInput.parse(raw);
  return operation("ORDER_TRANSITION",key,{...input,actorId},async tx=>{
    await assertActor(tx,actorId,true);
    await warehouseLock(tx);
    const order=await tx.order.findUnique({where:{id:input.orderId},include:{items:{include:{reservation:true}}}});
    if(!order) throw new BusinessError("ORDER_NOT_FOUND",404);
    if(order.status===input.status) return {id:order.id,status:order.status,version:order.version};
    if(order.version!==input.version) throw new BusinessError("STALE_ORDER",409);
    if(!allowed[order.status].includes(input.status)) throw new BusinessError("INVALID_TRANSITION",409);
    for(const item of order.items.sort((a,b)=>a.variantId.localeCompare(b.variantId))) {
      if(input.status==="CONFIRMED") {
        const changed=await tx.$executeRaw`UPDATE "InventoryBalance" SET "reserved"="reserved"+${item.quantity}, "version"="version"+1, "updatedAt"=now() WHERE "variantId"=${item.variantId} AND "onHand"-"reserved">=${item.quantity}`;
        if(changed!==1) throw new BusinessError("INSUFFICIENT_STOCK",409);
        await tx.stockReservation.create({data:{orderItemId:item.id,variantId:item.variantId,quantity:item.quantity}});
      }
      if(input.status==="DELIVERED" || input.status==="CANCELLED") {
        if(item.reservation?.status==="ACTIVE") {
          await tx.inventoryBalance.update({where:{variantId:item.variantId},data:{reserved:{decrement:item.quantity},...(input.status==="DELIVERED"?{onHand:{decrement:item.quantity}}:{}),version:{increment:1}}});
          await tx.stockReservation.update({where:{orderItemId:item.id},data:{status:input.status==="DELIVERED"?"CONSUMED":"RELEASED"}});
          if(input.status==="DELIVERED") await tx.stockMovement.create({data:{operationKey:`sale:${order.id}:${item.id}`,variantId:item.variantId,type:"SALE",quantityDelta:-item.quantity,unitPriceKzt:item.unitPriceKzt,orderItemId:item.id,actorId,reason:`Order ${order.number} delivered`,occurredAt:new Date()}});
        } else if(input.status==="DELIVERED") throw new BusinessError("RESERVATION_MISSING",409);
      }
    }
    const result=await tx.order.update({where:{id:order.id},data:{status:input.status,version:{increment:1},...(input.status==="DELIVERED"?{deliveredAt:new Date()}: {})},select:{id:true,status:true,version:true}});
    await tx.orderEvent.create({data:{operationKey:key,orderId:order.id,fromStatus:order.status,toStatus:input.status,actorId}});
    await tx.outboxEvent.create({data:{type:"order.statusChanged",payload:{orderId:order.id,status:input.status}}});
    return result;
  });
}

export async function moveStock(raw:unknown,key:string,actorId:string) {
  const input=stockInput.parse(raw);
  return operation("STOCK_MOVEMENT",key,{...input,actorId},async tx=>{
    await assertActor(tx,actorId,input.type==="SALE"); await warehouseLock(tx);
    const variant=await tx.productVariant.findUnique({where:{id:input.variantId},include:{balance:true}});
    if(!variant?.balance) throw new BusinessError("PRODUCT_UNAVAILABLE",404);
    const delta=input.type==="SALE"?-input.quantity:input.quantity;
    if(variant.balance.onHand+delta<variant.balance.reserved) throw new BusinessError("INSUFFICIENT_STOCK",409);
    const unitPriceKzt=input.type==="SALE"?(input.unitPriceKzt||variant.priceKzt):null;
    if(input.type==="SALE" && !unitPriceKzt) throw new BusinessError("PRICE_REQUIRED");
    await tx.inventoryBalance.update({where:{variantId:variant.id},data:{onHand:{increment:delta},version:{increment:1}}});
    const movement=await tx.stockMovement.create({data:{operationKey:key,variantId:variant.id,type:input.type,quantityDelta:delta,unitPriceKzt,actorId,reason:input.reason,occurredAt:new Date()}});
    return {id:movement.id};
  });
}

export async function returnStock(raw:unknown,key:string,actorId:string) {
  const input=returnInput.parse(raw);
  return operation("RETURN",key,{...input,actorId},async tx=>{
    await assertActor(tx,actorId,true); await warehouseLock(tx);
    const sale=await tx.stockMovement.findUnique({where:{id:input.movementId}});
    if(!sale || sale.type!=="SALE" || !sale.variantId || !sale.unitPriceKzt) throw new BusinessError("SALE_NOT_FOUND",404);
    const returned=await tx.stockMovement.aggregate({where:{relatedMovementId:sale.id,type:"RETURN"},_sum:{quantityDelta:true}});
    if((returned._sum.quantityDelta||0)+input.quantity>-sale.quantityDelta) throw new BusinessError("RETURN_EXCEEDS_SALE",409);
    await tx.inventoryBalance.update({where:{variantId:sale.variantId},data:{onHand:{increment:input.quantity},version:{increment:1}}});
    const movement=await tx.stockMovement.create({data:{operationKey:key,variantId:sale.variantId,type:"RETURN",quantityDelta:input.quantity,unitPriceKzt:sale.unitPriceKzt,relatedMovementId:sale.id,orderItemId:sale.orderItemId,reason:input.reason,actorId,occurredAt:new Date()}});
    return {id:movement.id};
  });
}

export async function allocateStock(raw:unknown,key:string,actorId:string) {
  const input=allocationInput.parse(raw);
  return operation("ALLOCATION",key,{...input,actorId},async tx=>{
    await assertActor(tx,actorId); await warehouseLock(tx);
    const source=await tx.unallocatedStock.findUnique({where:{id:input.sourceId}});
    const variant=await tx.productVariant.findUnique({where:{id:input.variantId},include:{product:true}});
    if(!source || !variant || !source.candidateModels.includes(variant.product.model) || source.widthCm!==variant.widthCm || source.lengthCm!==variant.lengthCm) throw new BusinessError("INVALID_ALLOCATION");
    if(source.quantity<input.quantity) throw new BusinessError("INSUFFICIENT_STOCK",409);
    await tx.unallocatedStock.update({where:{id:source.id},data:{quantity:{decrement:input.quantity}}});
    await tx.inventoryBalance.update({where:{variantId:variant.id},data:{onHand:{increment:input.quantity},version:{increment:1}}});
    await tx.stockMovement.createMany({data:[
      {operationKey:`${key}:source`,unallocatedStockId:source.id,type:"ALLOCATION",quantityDelta:-input.quantity,actorId,reason:`Allocated to ${variant.sku}`},
      {operationKey:`${key}:target`,variantId:variant.id,type:"ALLOCATION",quantityDelta:input.quantity,actorId,reason:`Allocated from ${source.reference}`},
    ]});
    return {quantity:input.quantity};
  });
}

export async function countStock(raw:unknown,key:string,actorId:string) {
  const input=countInput.parse(raw);
  return operation("STOCK_COUNT",key,{...input,actorId},async tx=>{
    await assertActor(tx,actorId); await warehouseLock(tx);
    const zones=await tx.warehouseZone.findMany();
    if(input.zones.length!==zones.length || input.zones.some(z=>!zones.some(v=>v.id===z.zoneId))) throw new BusinessError("ALL_ZONES_REQUIRED");
    const known=await tx.inventoryBalance.aggregate({_sum:{onHand:true}});
    const unknown=await tx.unallocatedStock.aggregate({_sum:{quantity:true}});
    const expected=(known._sum.onHand||0)+(unknown._sum.quantity||0);
    const count=await tx.stockCount.create({data:{reference:key,status:"COMPLETED",accountingSnapshot:expected,countedAt:new Date(),completedAt:new Date(),actorId,zones:{create:input.zones}}});
    return {id:count.id,expected,actual:input.zones.reduce((s,z)=>s+z.quantity,0)};
  });
}
