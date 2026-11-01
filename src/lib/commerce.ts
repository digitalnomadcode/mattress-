import { z } from "zod";

export function normalizePhone(value: string) {
  let digits = value.replace(/[\s()+-]/g, "");
  if (/^8\d{10}$/.test(digits)) digits = `7${digits.slice(1)}`;
  return /^[1-9]\d{8,14}$/.test(digits) ? `+${digits}` : "";
}
export const phoneSchema = z.string().max(35).transform(normalizePhone).refine(Boolean, "INVALID_PHONE");
export const orderInput = z.object({
  customerName: z.string().trim().min(2).max(100), phone: phoneSchema,
  locale: z.enum(["ru","kk"]), deliveryMethod: z.enum(["DELIVERY","PICKUP"]),
  city: z.enum(["ALMATY","ASTANA"]), address: z.string().trim().max(500).default(""),
  note: z.string().trim().max(1000).default(""),
  items: z.array(z.object({ sku: z.string().min(1).max(80), quantity: z.number().int().min(1).max(99) })).min(1).max(12),
}).refine(v=>v.deliveryMethod!=="DELIVERY" || v.address.length>=5,{message:"ADDRESS_REQUIRED",path:["address"]})
  .refine(v=>new Set(v.items.map(i=>i.sku)).size===v.items.length,{message:"DUPLICATE_SKU",path:["items"]});
export type OrderInput = z.input<typeof orderInput>;
export const orderStatuses = ["NEW","CONFIRMED","PROCESSING","DELIVERED","CANCELLED"] as const;
export type Status = (typeof orderStatuses)[number];
export const statusLabels = {
  ru: { NEW:"Новый", CONFIRMED:"Подтверждён", PROCESSING:"В обработке", DELIVERED:"Доставлен", CANCELLED:"Отменён" },
  kk: { NEW:"Жаңа", CONFIRMED:"Расталды", PROCESSING:"Дайындалып жатыр", DELIVERED:"Жеткізілді", CANCELLED:"Бас тартылды" },
};
export const transitionInput = z.object({ orderId:z.string().min(1), status:z.enum(orderStatuses), version:z.number().int().nonnegative() });
export const stockInput = z.object({ variantId:z.string().min(1), type:z.enum(["RECEIPT","SALE","ADJUSTMENT"]), quantity:z.number().int().min(-10000).max(10000).refine(v=>v!==0), unitPriceKzt:z.number().int().positive().max(10000000).optional(), reason:z.string().trim().min(3).max(500) })
  .refine(v=>v.type==="ADJUSTMENT" || v.quantity>0,{message:"POSITIVE_QUANTITY_REQUIRED"});
export const returnInput = z.object({ movementId:z.string().min(1), quantity:z.number().int().positive().max(10000), reason:z.string().trim().min(3).max(500) });
export const allocationInput = z.object({ sourceId:z.string().min(1), variantId:z.string().min(1), quantity:z.number().int().positive().max(10000) });
export const countInput = z.object({ zones:z.array(z.object({zoneId:z.string().min(1),quantity:z.number().int().min(0).max(100000)})).min(1).max(20) }).refine(v=>new Set(v.zones.map(z=>z.zoneId)).size===v.zones.length);
