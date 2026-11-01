import ExcelJS from "exceljs";
import {requireAdmin} from "@/server/auth";
import {getDb} from "@/server/db";
import {apiError} from "@/server/http";
export const maxDuration=30;
export async function GET(){try{
 await requireAdmin();const db=getDb();const workbook=new ExcelJS.Workbook();workbook.creator="Velora";
 const sheet=workbook.addWorksheet("Inventory");sheet.columns=[{header:"Модель / Үлгі",key:"model",width:20},{header:"Название / Атауы",key:"name",width:25},{header:"SKU",key:"sku",width:26},{header:"Ширина, см / Ені",key:"width",width:20},{header:"Остаток / Қалдық",key:"onHand",width:22},{header:"Резерв",key:"reserved",width:15},{header:"Доступно / Бос",key:"available",width:22},{header:"Цена / Баға, KZT",key:"price",width:22}];
 const variants=await db.productVariant.findMany({include:{product:true,balance:true},orderBy:[{product:{model:"asc"}},{widthCm:"asc"}]});
 for(const v of variants)sheet.addRow({model:v.product.model,name:v.product.name,sku:v.sku,width:v.widthCm,onHand:v.balance?.onHand||0,reserved:v.balance?.reserved||0,available:(v.balance?.onHand||0)-(v.balance?.reserved||0),price:v.priceKzt});
 for(const u of await db.unallocatedStock.findMany())sheet.addRow({model:"Требует уточнения / Нақтылау қажет",name:u.candidateModels.join(" / "),width:u.widthCm,onHand:u.quantity,reserved:0,available:null});
 sheet.getRow(1).font={bold:true};sheet.views=[{state:"frozen",ySplit:1}];
 const journal=workbook.addWorksheet("Stock movements");journal.columns=[{header:"ID",key:"id",width:28},{header:"Дата ввода / Енгізілген күн",key:"date",width:26},{header:"SKU",key:"sku",width:24},{header:"Тип / Түрі",key:"type",width:18},{header:"Количество / Саны",key:"quantity",width:20},{header:"Причина / Себебі",key:"reason",width:60}];
 const movements=await db.stockMovement.findMany({include:{variant:true},orderBy:{createdAt:"asc"}});
 for(const m of movements)journal.addRow({id:m.id,date:m.createdAt,sku:m.variant?.sku||"UNALLOCATED-90",type:m.type,quantity:m.quantityDelta,reason:m.reason});
 journal.getRow(1).font={bold:true};
 const bytes=await workbook.xlsx.writeBuffer();return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename=velora-inventory.xlsx","Cache-Control":"no-store"}});
}catch(e){return apiError(e);}}
