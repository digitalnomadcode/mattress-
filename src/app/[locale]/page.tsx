import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUpRight, Layers, Ruler, MoveVertical, ArrowRight, Waves, CircleDot, Sparkles } from "lucide-react";
import { localeSchema, productTitle } from "@/lib/catalog";
import { getPublicProducts, getPublicSettings } from "@/server/public-data";
import { dictionary } from "@/lib/dictionary";
import { HeroCutaway } from "@/components/hero-cutaway";
import { HomepageMedia, HomepageReviews } from "@/components/homepage-media";
import { StorePresence } from "@/components/store-presence";
import { StoreContacts } from "@/components/store-contacts";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data; const t = dictionary(locale);
  const [products, settings] = await Promise.all([getPublicProducts(), getPublicSettings()]);
  return <main id="main">
    <section className="hero hero-scroll"><div className="container hero-grid">
      <div className="hero-copy"><p className="eyebrow"><span/>{t.eyebrow}</p><h1>{t.hero}</h1><p className="hero-intro">{t.intro}</p>
        <div className="hero-actions"><Link className="button primary" href={`/${locale}/catalog`}>{t.browse}<ArrowUpRight size={19}/></Link><Link className="text-link" href="#product">{t.guide}<ArrowDown size={16}/></Link></div>
        <div className="hero-facts"><div><strong>05</strong><span>{t.all}</span></div><div><strong>25–30 <small>{t.cm}</small></strong><span>{t.height}</span></div><div><strong>200 <small>{t.cm}</small></strong><span>{t.length}</span></div></div>
      </div>
      <div className="hero-art hero-cutaway-art"><HeroCutaway locale={locale} products={products}/></div>
    </div></section>
    <section className="container section about-section" id="about">
      <p className="eyebrow">01 / {t.aboutEyebrow}</p>
      <div className="about-grid"><h2>{t.aboutTitle}</h2><div className="about-copy"><p className="about-lead">{t.aboutLead}</p><p>{t.aboutText}</p><p className="about-signature">{t.aboutSignature}</p></div></div>
    </section>
    <section className="product-story section" id="product"><div className="container">
      <div className="section-heading"><div><p className="eyebrow">02 / {t.productEyebrow}</p><h2>{t.productTitle}</h2></div><p>{t.productIntro}</p></div>
      <div className="story-grid">{[
        { title: t.foamStoryTitle, text: t.foamStoryText, Icon: Waves },
        { title: t.springStoryTitle, text: t.springStoryText, Icon: CircleDot },
        { title: t.memoryStoryTitle, text: t.memoryStoryText, Icon: Sparkles },
      ].map(({ title, text, Icon }, i) => <article className="story-card" key={title}><span className="story-index">0{i+1}</span><Icon size={42} strokeWidth={1.2}/><h3>{title}</h3><p>{text}</p></article>)}</div>
    </div></section>
    <section className="container section collection-intro" id="collection">
      <div className="section-heading"><div><p className="eyebrow">03 / {t.collection}</p><h2>{t.collectionIntro}</h2></div><p>{t.collectionLandingText}</p></div>
      <div className="collection-lines">{products.map((product, i) => <Link key={product.model} className="collection-line" href={`/${locale}/catalog/${product.model}`} aria-label={productTitle(product)}>
        <span className="collection-number">0{i+1}</span><h3>{product.name}</h3><p>{product.description[locale]}</p><span className="collection-height">{product.height} {t.cm}</span><ArrowUpRight size={24} strokeWidth={1.3}/>
      </Link>)}</div>
      <Link className="button primary collection-cta" href={`/${locale}/catalog`}>{t.collectionLink}<ArrowUpRight size={19}/></Link>
    </section>
    <section className="approach section" id="approach"><div className="container"><div className="section-heading"><div><p className="eyebrow">04 / {t.detailEyebrow}</p><h2>{t.detailTitle}</h2></div><p>{t.detailText}</p></div>
      <div className="guide-grid">{[
        { title: t.step1, text: t.step1Text, Icon: Ruler }, { title: t.step2, text: t.step2Text, Icon: Layers }, { title: t.step3, text: t.step3Text, Icon: MoveVertical },
      ].map(({ title, text, Icon }, i) => <article key={title} className="guide-card"><div className="guide-top"><Icon strokeWidth={1.3} size={34}/><span>0{i + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </div></section>
    <HomepageMedia locale={locale}/>
    <StorePresence locale={locale}/>
    <section className="container faq-section section"><p className="eyebrow">06 / {t.faqEyebrow}</p><h2>{t.faq}</h2><div className="faq-list">{[[t.faq1,t.answer1],[t.faq2,t.answer2],[t.faq3,t.answer3]].map(([q,a]) => <details key={q}><summary>{q}<ArrowDown size={18}/></summary><p>{a}</p></details>)}</div></section>
    <aside className="container preview-note"><span>{t.preview}</span><p>{t.previewText}</p><ArrowRight size={18}/></aside>
    <HomepageReviews locale={locale}/>
    <StoreContacts locale={locale} contacts={settings}/>
  </main>;
}
