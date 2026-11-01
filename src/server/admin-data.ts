import {getDb} from "./db";
import type {requireAdmin} from "./auth";

export async function getAdminData(actor:Awaited<ReturnType<typeof requireAdmin>>) {
 const db=getDb();
 const [variants,unallocated,orders,movements,counts,zones,settings,orderCount,deliveredCount,daily]=await Promise.all([
  db.productVariant.findMany({include:{product:{include:{translations:true}},balance:true},orderBy:[{product:{model:"asc"}},{widthCm:"asc"}]}),
  db.unallocatedStock.findMany({orderBy:{reference:"asc"}}),
  actor.role==="WAREHOUSE"?Promise.resolve([]):db.order.findMany({take:200,orderBy:{createdAt:"desc"},include:{items:true}}),
  db.stockMovement.findMany({take:200,orderBy:{createdAt:"desc"},include:{variant:{include:{product:true}},returns:{select:{quantityDelta:true}}}}),
  db.stockCount.findMany({take:30,orderBy:{createdAt:"desc"},include:{zones:{include:{zone:true}}}}),
  db.warehouseZone.findMany({orderBy:{code:"asc"}}),db.storeSettings.findUnique({where:{id:"store"}}),
  db.order.count(),db.order.count({where:{status:"DELIVERED"}}),
  db.$queryRaw<{day:string;delta:bigint;revenue:bigint;sold:bigint}[]>`SELECT to_char("createdAt" AT TIME ZONE 'Asia/Almaty','YYYY-MM-DD') AS day, SUM("quantityDelta")::bigint AS delta, SUM(CASE WHEN "type" IN ('SALE','RETURN') THEN -"quantityDelta" * COALESCE("unitPriceKzt",0)::bigint ELSE 0 END)::bigint AS revenue, SUM(CASE WHEN "type"='SALE' THEN -"quantityDelta" ELSE 0 END)::bigint AS sold FROM "StockMovement" GROUP BY day ORDER BY day`,
 ]);
 let balance=0;const chart=daily.map(d=>{balance+=Number(d.delta);return {day:d.day,stock:balance,revenue:actor.role==="WAREHOUSE"?0:Number(d.revenue),sold:Number(d.sold)};}).slice(-30);
 const onHand=variants.reduce((s,v)=>s+(v.balance?.onHand||0),0);const reserved=variants.reduce((s,v)=>s+(v.balance?.reserved||0),0);const unknown=unallocated.reduce((s,v)=>s+v.quantity,0);
 return {actor:{id:actor.id,email:actor.email,role:actor.role},variants,unallocated,orders,movements,counts,zones,settings,
  stats:{onHand:onHand+unknown,reserved,available:onHand-reserved,unallocated:unknown,orders:orderCount,delivered:deliveredCount,revenueKzt:actor.role==="WAREHOUSE"?0:daily.reduce((s,d)=>s+Number(d.revenue),0)},chart};
}
export type AdminData=Awaited<ReturnType<typeof getAdminData>>;
