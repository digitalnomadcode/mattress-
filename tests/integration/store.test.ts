import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {isolatedDatabase} from "../support/database";
import {getDb} from "../../src/server/db";
import {seedStore} from "../../src/server/seed";
import {createOrder,transitionOrder,moveStock,allocateStock,returnStock,countStock} from "../../src/server/commerce-service";
import {BusinessError} from "../../src/server/errors";
let fixture:Awaited<ReturnType<typeof isolatedDatabase>>;
let actor:string;let warehouse:string;
const key=()=>randomUUID();
const order=(sku:string,quantity=1)=>({customerName:"Test Buyer",phone:"+77000000001",locale:"kk",deliveryMethod:"PICKUP",city:"ALMATY",items:[{sku,quantity}]});
before(async()=>{fixture=await isolatedDatabase();await seedStore();actor=(await getDb().adminUser.create({data:{email:"owner@example.test",role:"OWNER"}})).id;warehouse=(await getDb().adminUser.create({data:{email:"warehouse@example.test",role:"WAREHOUSE"}})).id;});
after(async()=>{await getDb().$disconnect();await fixture?.cleanup();});

test("seed is repeatable and 89 allocated plus 10 unknown reconcile to 99",async()=>{
 await seedStore();assert.equal(await getDb().productVariant.count(),12);
 const sum=await getDb().inventoryBalance.aggregate({_sum:{onHand:true}});assert.equal(sum._sum.onHand,89);
 assert.equal((await getDb().unallocatedStock.findFirstOrThrow()).quantity,10);
 const count=await getDb().stockCount.findFirstOrThrow({include:{zones:true}});assert.equal(count.zones.reduce((s,z)=>s+z.quantity,0),99);
});
test("a new order does not reserve; replay returns the same order and ignores untrusted client pricing",async()=>{
 const k=key();const request={...order("CK2601-160x200"),priceKzt:1};const a=await createOrder(request,k);const b=await createOrder(request,k);assert.equal(a.id,b.id);assert.equal(a.totalKzt,149990);
 assert.equal((await getDb().inventoryBalance.findFirstOrThrow({where:{variant:{sku:"CK2601-160x200"}}})).reserved,0);
 await assert.rejects(()=>createOrder(order("CK2601-160x200",2),k),e=>e instanceof BusinessError&&e.code==="IDEMPOTENCY_CONFLICT");
});
test("confirmation reserves once, delivery posts one sale, delivered order cannot be cancelled, physical return is bounded",async()=>{
 const o=await createOrder(order("CK2602-160x200",2),key());const k=key();
 const confirmed=await transitionOrder({orderId:o.id,status:"CONFIRMED",version:0},k,actor);
 await transitionOrder({orderId:o.id,status:"CONFIRMED",version:0},k,actor);
 let b=await getDb().inventoryBalance.findFirstOrThrow({where:{variant:{sku:"CK2602-160x200"}}});assert.equal(b.onHand,7);assert.equal(b.reserved,2);
 await transitionOrder({orderId:o.id,status:"DELIVERED",version:confirmed.version},key(),actor);
 await transitionOrder({orderId:o.id,status:"DELIVERED",version:1},key(),actor);
 b=await getDb().inventoryBalance.findUniqueOrThrow({where:{variantId:b.variantId}});assert.equal(b.onHand,5);assert.equal(b.reserved,0);
 const sale=await getDb().stockMovement.findFirstOrThrow({where:{orderItem:{orderId:o.id},type:"SALE"}});assert.equal(sale.unitPriceKzt,152990);assert.equal(await getDb().stockMovement.count({where:{orderItem:{orderId:o.id},type:"SALE"}}),1);
 await assert.rejects(()=>transitionOrder({orderId:o.id,status:"CANCELLED",version:2},key(),actor));
 const r=key();await returnStock({movementId:sale.id,quantity:1,reason:"Test physical return"},r,actor);await returnStock({movementId:sale.id,quantity:1,reason:"Test physical return"},r,actor);
 await assert.rejects(()=>returnStock({movementId:sale.id,quantity:2,reason:"Too many returns"},key(),actor));
});
test("cancellation releases the reserve and does not create a sale",async()=>{
 const o=await createOrder(order("CK2605-160x200"),key());await transitionOrder({orderId:o.id,status:"CONFIRMED",version:0},key(),actor);await transitionOrder({orderId:o.id,status:"CANCELLED",version:1},key(),actor);
 const b=await getDb().inventoryBalance.findFirstOrThrow({where:{variant:{sku:"CK2605-160x200"}}});assert.equal(b.onHand,5);assert.equal(b.reserved,0);assert.equal(await getDb().stockMovement.count({where:{orderItem:{orderId:o.id},type:"SALE"}}),0);
});
test("two simultaneous confirmations cannot reserve the final unit twice",async()=>{
 const v=await getDb().productVariant.findUniqueOrThrow({where:{sku:"CK2606-160x200"}});await moveStock({variantId:v.id,type:"ADJUSTMENT",quantity:-3,reason:"Test final unit"},key(),actor);
 const a=await createOrder(order(v.sku),key());const b=await createOrder(order(v.sku),key());const results=await Promise.allSettled([transitionOrder({orderId:a.id,status:"CONFIRMED",version:0},key(),actor),transitionOrder({orderId:b.id,status:"CONFIRMED",version:0},key(),actor)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);const balance=await getDb().inventoryBalance.findUniqueOrThrow({where:{variantId:v.id}});assert.equal(balance.onHand,1);assert.equal(balance.reserved,1);
});
test("unallocated 90cm cannot be ordered; allocating creates paired entries and preserves total",async()=>{
 await assert.rejects(()=>createOrder(order("CK2601-90x200"),key()));const source=await getDb().unallocatedStock.findFirstOrThrow();const v=await getDb().productVariant.findUniqueOrThrow({where:{sku:"CK2601-90x200"}});const k=key();
 const before=(await getDb().inventoryBalance.aggregate({_sum:{onHand:true}}))._sum.onHand!+source.quantity;
 await allocateStock({sourceId:source.id,variantId:v.id,quantity:3},k,actor);await allocateStock({sourceId:source.id,variantId:v.id,quantity:3},k,actor);
 const remaining=(await getDb().unallocatedStock.findUniqueOrThrow({where:{id:source.id}})).quantity;assert.equal(remaining,7);assert.equal((await getDb().inventoryBalance.findUniqueOrThrow({where:{variantId:v.id}})).onHand,3);
 assert.equal((await getDb().inventoryBalance.aggregate({_sum:{onHand:true}}))._sum.onHand!+remaining,before);assert.equal(await getDb().stockMovement.count({where:{operationKey:{startsWith:k}}}),2);
});
test("database rejects negative balances and mutation of the stock journal; warehouse role cannot perform sales",async()=>{
 const v=await getDb().productVariant.findUniqueOrThrow({where:{sku:"CK2603-160x200"}});await assert.rejects(()=>getDb().inventoryBalance.update({where:{variantId:v.id},data:{onHand:-1}}));
 const m=await getDb().stockMovement.findFirstOrThrow();await assert.rejects(()=>getDb().stockMovement.update({where:{id:m.id},data:{reason:"Overwrite"}}));
 await assert.rejects(()=>moveStock({variantId:v.id,type:"SALE",quantity:1,reason:"Forbidden sale"},key(),warehouse),e=>e instanceof BusinessError&&e.code==="FORBIDDEN");
});
test("physical count records discrepancy without changing SKU balances",async()=>{
 const zones=await getDb().warehouseZone.findMany();const before=(await getDb().inventoryBalance.aggregate({_sum:{onHand:true}}))._sum.onHand;
 const result=await countStock({zones:zones.map(z=>({zoneId:z.id,quantity:1}))},key(),actor);assert.equal(result.actual,4);assert.notEqual(result.expected,result.actual);assert.equal((await getDb().inventoryBalance.aggregate({_sum:{onHand:true}}))._sum.onHand,before);
});
