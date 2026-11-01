import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { productTitle, localeSchema, modelCodes } from "@/lib/catalog";
import { getPublicProducts, getPublicSettings } from "@/server/public-data";
import { brandName } from "@/lib/brand";
import { dictionary } from "@/lib/dictionary";
import { ProductGallery } from "@/components/product-gallery";
import { VariantSelector } from "@/components/variant-selector";

type Props = { params: Promise<{ locale: string; model: string }> };
export function generateStaticParams() { return ["ru", "kk"].flatMap(locale => modelCodes.map(model => ({ locale, model }))); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model, locale } = await params;
  const p = (await getPublicProducts()).find(p=>p.model===model); const l = localeSchema.safeParse(locale);
  if (!p || !l.success) return {};
  return { title: productTitle(p), description: `${productTitle(p)} — ${p.description[l.data]}` };
}

export default async function ProductPage({ params }: Props) {
  const { locale: rawLocale, model } = await params;
  const l = localeSchema.safeParse(rawLocale); const p = (await getPublicProducts()).find(p=>p.model===model);
  if (!l.success || !p) notFound();
  const locale = l.data; const t = dictionary(locale);
  const settings = await getPublicSettings();
  return <main className="container product-page" id="main">
    <Link className="back-link" href={`/${locale}/catalog`}><ArrowLeft size={17}/>{t.back}</Link>
    <div className="detail-grid"><div className="detail-visual"><ProductGallery model={p.model} name={`${brandName} ${p.name}`} locale={locale}/></div>
      <div className="detail-copy"><p className="eyebrow">{brandName} / {p.construction === "foam" ? t.foam : t.spring}</p><h1>{p.name}</h1><p className="detail-description">{p.description[locale]}</p><div className="detail-model"><span>{t.model}</span><span>{p.model}</span></div><VariantSelector product={p} locale={locale} whatsappNumber={settings.whatsappNumber}/></div>
    </div>
    <section className="product-features"><h2>{t.featureTitle}</h2><div><ul>{p.features[locale].map(f => <li key={f}><Check size={18}/>{f}</li>)}</ul><p>{t.detailNote}</p></div></section>
    {p.specifications&&<dl className="product-specifications">{[
      [locale==="kk"?"Қаттылығы":"Жёсткость",p.specifications.hardness],
      [locale==="kk"?"Көтеретін салмағы":"Максимальная нагрузка",p.specifications.maximumLoadKg?`${p.specifications.maximumLoadKg} кг`:null],
      [locale==="kk"?"Өндіруші":"Производитель",p.specifications.manufacturer],
      [locale==="kk"?"Өндірілген ел":"Страна производства",p.specifications.country],
      [locale==="kk"?"Кепілдік мерзімі":"Гарантия",p.specifications.warrantyMonths?`${p.specifications.warrantyMonths} ${locale==="kk"?"ай":"мес."}`:null],
    ].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
  </main>;
}
