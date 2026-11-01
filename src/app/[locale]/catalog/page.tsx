import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { localeSchema } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";
import { Catalog } from "@/components/catalog";
import { getPublicProducts } from "@/server/public-data";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) return {};
  const t = dictionary(parsed.data);
  return { title: t.catalog, description: t.collectionText };
}

export default async function CatalogPage({ params }: Props) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data; const t = dictionary(locale);
  const products = await getPublicProducts();
  return <main className="container catalog-page" id="main">
    <Link href={`/${locale}`} className="back-link"><ArrowLeft size={17}/>{t.home}</Link>
    <div className="section-heading"><div><p className="eyebrow">VELORA / {t.collection}</p><h1>{t.catalogTitle}</h1></div><p>{t.collectionText}</p></div>
    <Catalog locale={locale} catalogProducts={products}/>
    <aside className="catalog-location-note"><p>{t.catalogLocationNote}</p><Link href={`/${locale}#locations`}>{t.presenceTitle}</Link></aside>
  </main>;
}
