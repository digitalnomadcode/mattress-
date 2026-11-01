import { z } from "zod";
import { brandName } from "./brand";

export const localeSchema = z.enum(["ru", "kk"]);
export type Locale = z.infer<typeof localeSchema>;
export const modelCodes = ["2601", "2602", "2603", "2605", "2606"] as const;
export type ModelCode = (typeof modelCodes)[number];
export const productNames = {
  "2601": "Luna",
  "2602": "Aria",
  "2603": "Vita",
  "2605": "Alba",
  "2606": "Oro",
} as const satisfies Record<ModelCode, string>;
export const widthSchema = z.union([z.literal(90), z.literal(160), z.literal(180)]);
export type Width = z.infer<typeof widthSchema>;

export const variantSchema = z.object({
  sku: z.string().regex(/^CK260[12356]-\d{2,3}x200$/),
  model: z.enum(modelCodes),
  width: widthSchema,
  length: z.literal(200),
  height: z.number().int().positive(),
  priceKzt: z.number().int().positive(),
});
export type CatalogVariant = z.infer<typeof variantSchema> & { available?:number; allocationPending?:boolean };
export type Product = {
  model: ModelCode;
  name: string;
  height: number;
  construction: "foam" | "spring";
  description: Record<Locale, string>;
  features: Record<Locale, string[]>;
  variants: CatalogVariant[];
  specifications?:{hardness:string|null;maximumLoadKg:number|null;manufacturer:string|null;country:string|null;warrantyMonths:number|null};
};

// Source: «матрас цены.xlsx», «Розничный прайс», rows 6–17.
// These are current retail prices, not historical sale prices.
const specifications: Omit<Product, "variants" | "name">[] = [
  { model: "2601", height: 25, construction: "foam",
    description: { ru: "Беспружинный матрас с пенной основой", kk: "Көбіктен жасалған серіппесіз матрас" },
    features: { ru: ["Без пружин", "Пенные слои 5 и 20 см", "Трикотажная ткань"], kk: ["Серіппесіз құрылым", "Қалыңдығы 5 және 20 см көбік қабаттары", "Трикотаж мата"] } },
  { model: "2602", height: 27, construction: "foam",
    description: { ru: "Беспружинный матрас с эффектом памяти", kk: "Дене пішініне бейімделетін көбік қабаты бар серіппесіз матрас" },
    features: { ru: ["Без пружин", "Пена с эффектом памяти 2 см", "Трикотажная ткань"], kk: ["Серіппесіз құрылым", "Дене пішініне бейімделетін көбік — 2 см", "Трикотаж мата"] } },
  { model: "2603", height: 25, construction: "spring",
    description: { ru: "Независимые пружины и пенные слои", kk: "Көбік қабаттары мен тәуелсіз серіппелері бар матрас" },
    features: { ru: ["Независимые пружины Pocket Spring", "Усиленный периметр", "Жаккардовая трикотажная ткань"], kk: ["Жеке қапшықтарға салынған Pocket Spring серіппелері", "Көбікпен күшейтілген жиектер", "Жаккард өрнекті трикотаж"] } },
  { model: "2605", height: 28, construction: "spring",
    description: { ru: "Независимые пружины и гелевая пена с памятью", kk: "Гельді көбік қабаты мен тәуелсіз серіппелері бар матрас" },
    features: { ru: ["Независимые пружины Pocket Spring", "Гелевая пена с эффектом памяти", "Рельефный пенный слой"], kk: ["Жеке қапшықтарға салынған Pocket Spring серіппелері", "Дене пішініне бейімделетін гельді көбік", "Бедерлі көбік қабаты"] } },
  { model: "2606", height: 30, construction: "spring",
    description: { ru: "Комбинированная пена и эффект памяти", kk: "Бірнеше көбік қабаты мен тәуелсіз серіппелері бар матрас" },
    features: { ru: ["Независимые пружины — по схеме состава", "Гелевая пена с эффектом памяти", "Усиленный периметр"], kk: ["Тәуелсіз серіппелер — құрам сызбасында көрсетілген", "Дене пішініне бейімделетін гельді көбік", "Көбікпен күшейтілген жиектер"] } },
];

const prices: Record<ModelCode, Partial<Record<Width, number>>> = {
  "2601": { 90: 99990, 160: 149990, 180: 156990 },
  "2602": { 160: 152990, 180: 158990 },
  "2603": { 90: 99990, 160: 147990, 180: 149990 },
  "2605": { 160: 181990, 180: 187990 },
  "2606": { 160: 199990, 180: 206990 },
};

export const products: Product[] = specifications.map((p) => ({
  ...p,
  name: productNames[p.model],
  variants: ([90, 160, 180] as const).flatMap((width) => {
    const priceKzt = prices[p.model][width];
    return priceKzt ? [variantSchema.parse({ sku: `CK${p.model}-${width}x200`, model: p.model, width, length: 200, height: p.height, priceKzt })] : [];
  }),
}));
export const variants = products.flatMap((p) => p.variants);
export const findProduct = (model: string) => products.find((p) => p.model === model);
export const productTitle = (product: Pick<Product, "name">) => `${brandName} ${product.name}`;
export function formatPrice(price: number) {
  // Both RU/KZ use grouped integers in KZT. Keep SSR/browser output identical:
  // different ICU versions disagree on the kk-KZ grouping character.
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Invalid KZT amount");
  return `${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")} ₸`;
}
