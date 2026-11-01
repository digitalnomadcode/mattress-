import {z} from "zod";
import {phoneSchema} from "@/lib/commerce";
import {operation} from "./operations";
import {BusinessError} from "./errors";

export async function editProduct(raw:unknown,key:string,actorId:string){
 const input=z.object({id:z.string(),name:z.string().trim().min(1).max(80),published:z.boolean(),descriptionRu:z.string().trim().min(5).max(5000),descriptionKk:z.string().trim().min(5).max(5000),hardness:z.string().max(100).default(""),manufacturer:z.string().max(200).default(""),country:z.string().max(100).default(""),maximumLoadKg:z.number().int().positive().max(1000).nullable().default(null),warrantyMonths:z.number().int().positive().max(1200).nullable().default(null)}).parse(raw);
 return operation("EDIT_PRODUCT",key,{...input,actorId},async tx=>{
  const actor=await tx.adminUser.findUnique({where:{id:actorId}});if(!actor||actor.disabled||actor.role==="WAREHOUSE")throw new BusinessError("FORBIDDEN",403);
  const p=await tx.product.update({where:{id:input.id},data:{name:input.name,published:input.published,hardness:input.hardness||null,manufacturer:input.manufacturer||null,country:input.country||null,maximumLoadKg:input.maximumLoadKg,warrantyMonths:input.warrantyMonths}});
  for(const locale of ["ru","kk"])await tx.productTranslation.upsert({where:{productId_locale:{productId:p.id,locale}},create:{productId:p.id,locale,title:`${p.brand} ${p.name}`,description:locale==="ru"?input.descriptionRu:input.descriptionKk},update:{title:`${p.brand} ${p.name}`,description:locale==="ru"?input.descriptionRu:input.descriptionKk}});
  return {id:p.id};
 });
}
export async function editPrice(raw:unknown,key:string,actorId:string){
 const input=z.object({variantId:z.string(),priceKzt:z.number().int().positive().max(10000000),heightCm:z.number().int().positive().max(100),active:z.boolean()}).parse(raw);
 return operation("EDIT_VARIANT",key,{...input,actorId},async tx=>{const actor=await tx.adminUser.findUnique({where:{id:actorId}});if(!actor||actor.disabled||actor.role==="WAREHOUSE")throw new BusinessError("FORBIDDEN",403);await tx.productVariant.update({where:{id:input.variantId},data:{priceKzt:input.priceKzt,heightCm:input.heightCm,active:input.active}});return {id:input.variantId};});
}
export async function editSettings(raw:unknown,key:string,actorId:string){
 const input=z.object({whatsappNumber:phoneSchema,phoneNumber:phoneSchema,instagramUsername:z.string().trim().regex(/^[A-Za-z0-9._]{1,30}$/),deliveryRu:z.string().max(3000),deliveryKk:z.string().max(3000),addressRu:z.string().max(1000).default(""),addressKk:z.string().max(1000).default("")}).parse(raw);
 return operation("EDIT_SETTINGS",key,{...input,actorId},async tx=>{const actor=await tx.adminUser.findUnique({where:{id:actorId}});if(!actor||actor.disabled||actor.role!=="OWNER")throw new BusinessError("FORBIDDEN",403);await tx.storeSettings.update({where:{id:"store"},data:input});return {saved:true};});
}
