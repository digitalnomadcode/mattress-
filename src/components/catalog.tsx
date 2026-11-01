"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { products, productTitle, formatPrice, type Locale } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";
import { MattressIllustration } from "./mattress-illustration";

export function Catalog({ locale, catalogProducts = products }: { locale: Locale; catalogProducts?: typeof products }) {
  const t = dictionary(locale);
  const [filter, setFilter] = useState("all");
  const visible = catalogProducts.filter(p => filter === "all" || p.construction === filter);
  return <>
    <div className="filter-bar" aria-label={t.catalog}>
      {([ ["all", t.all], ["foam", t.foam], ["spring", t.spring] ] as const).map(([value, text]) =>
        <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>{text}</button>)}
      <span className="filter-count" aria-live="polite">{String(visible.length).padStart(2, "0")}</span>
    </div>
    <div className="product-grid">{visible.map((p) => <article key={p.model} className="product-card">
      <Link href={`/${locale}/catalog/${p.model}`} className="product-visual" aria-label={productTitle(p)}>
        <span className="height-tag">{p.height} {t.cm}</span>
        <MattressIllustration model={p.model} label={t.illustration}/>
        <span className="product-open"><ArrowUpRight size={21}/></span>
      </Link>
      <div className="product-meta"><span>{p.construction === "foam" ? t.foam : t.spring}</span><span>{p.variants.map(v => v.width).join(" / ")} {t.cm}</span></div>
      <Link className="product-title" href={`/${locale}/catalog/${p.model}`}>{productTitle(p)}</Link>
      <p className="product-description">{p.description[locale]}</p>
      <div className="product-bottom"><strong>{locale === "ru" && <small>{t.from} </small>}{formatPrice(Math.min(...p.variants.map(v => v.priceKzt)))}{locale === "kk" && <small>{t.from}</small>}</strong><Link href={`/${locale}/catalog/${p.model}`} aria-label={`${t.details}: ${productTitle(p)}`}><ArrowRight size={22}/></Link></div>
    </article>)}</div>
  </>;
}
