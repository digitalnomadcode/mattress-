import { cache } from "react";
import { products, type Product, type CatalogVariant } from "@/lib/catalog";
import { storeContacts,storeLocations } from "@/lib/homepage-content";
import { getDb,databaseUrl } from "./db";
import { z } from "zod";

export const getPublicProducts=cache(async():Promise<Product[]>=>{
  if(!databaseUrl()) return products;
  const rows=await getDb().product.findMany({where:{published:true},include:{translations:true,variants:{where:{active:true},include:{balance:true},orderBy:{widthCm:"asc"}}},orderBy:{model:"asc"}});
  const unknown=await getDb().unallocatedStock.findMany({where:{quantity:{gt:0}}});
  return rows.flatMap(row=>{
    const original=products.find(p=>p.model===row.model);
    if(!original || !row.variants.some(v=>v.priceKzt!==null)) return [];
    const features=z.object({ru:z.array(z.string()),kk:z.array(z.string())}).safeParse(row.features);
    return [{...original,name:row.name,height:row.variants[0]?.heightCm||original.height,features:features.success?features.data:original.features,
      specifications:{hardness:row.hardness,maximumLoadKg:row.maximumLoadKg,manufacturer:row.manufacturer,country:row.country,warrantyMonths:row.warrantyMonths},
      description:{ru:row.translations.find(t=>t.locale==="ru")?.description||original.description.ru,kk:row.translations.find(t=>t.locale==="kk")?.description||original.description.kk},
      variants:row.variants.filter(v=>v.priceKzt!==null).map(v=>({sku:v.sku,model:original.model,width:v.widthCm as CatalogVariant["width"],length:v.lengthCm as 200,height:v.heightCm||original.height,priceKzt:v.priceKzt!,available:Math.max(0,(v.balance?.onHand||0)-(v.balance?.reserved||0)),allocationPending:unknown.some(u=>u.widthCm===v.widthCm && u.candidateModels.includes(row.model))})),
    }];
  });
});
export const getPublicSettings=cache(async()=>{
  if(!databaseUrl()) return {...storeContacts,locations:storeLocations,delivery:{ru:"",kk:""},address:{ru:"",kk:""}};
  const settings=await getDb().storeSettings.findUnique({where:{id:"store"}});
  return {
    instagramUsername:settings?.instagramUsername||storeContacts.instagramUsername,
    whatsappNumber:settings?.whatsappNumber||storeContacts.whatsappNumber,
    phoneNumber:settings?.phoneNumber||storeContacts.phoneNumber,
    locations:storeLocations,
    delivery:{ru:settings?.deliveryRu||"",kk:settings?.deliveryKk||""},
    address:{ru:settings?.addressRu||"",kk:settings?.addressKk||""},
  };
});
