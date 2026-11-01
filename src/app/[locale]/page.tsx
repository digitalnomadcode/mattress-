import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { localeSchema, productTitle, formatPrice } from "@/lib/catalog";
import { getPublicProducts, getPublicSettings } from "@/server/public-data";
import { dictionary } from "@/lib/dictionary";
import { HeroCutaway } from "@/components/hero-cutaway";
import { ProductPhoto } from "@/components/product-photo";
import { productPhotos } from "@/lib/product-photos";
import { HomepageMedia, HomepageReviews } from "@/components/homepage-media";
import { StorePresence } from "@/components/store-presence";
import { StoreContacts } from "@/components/store-contacts";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
 const parsed = localeSchema.safeParse((await params).locale);
 if (!parsed.success) notFound();
 const locale = parsed.data; const t = dictionary(locale); const kk = locale === "kk";
 const [products, settings] = await Promise.all([getPublicProducts(), getPublicSettings()]);
 return <main id="main">
 <section className="opening">
 <div className="opening-copy"><p className="eyebrow">{kk ? "ҮЙДЕГІ ЖАЙЛЫЛЫҚ — VELORA" : "ДОМА, С VELORA"}</p>
 <h1>{kk ? <>Күн аяқталды.<br/><em>Демалатын уақыт.</em></> : <>День позади.<br/><em>Вы дома.</em></>}</h1>
 <p className="opening-intro">{kk ? "Жайлы ұйқыға арналған бес матрас. Ішкі құрамын салыстырып, өзіңізге сай өлшемін таңдаңыз." : "Пять матрасов для вашей спальни. Разный состав, понятный выбор и комфорт, к которому хочется возвращаться."}</p>
 <div className="hero-actions"><Link className="button primary" href={`/${locale}/catalog`}>{t.browse}<ArrowUpRight size={18}/></Link></div>
 <a className="opening-foot" href="#collection">{kk ? "Коллекциямен танысу" : "Знакомство с коллекцией"}<ArrowDown size={17}/></a></div>
 <div className="opening-image"><Image src="/products/aria.jpg" alt={kk ? "Жарық жатын бөлмедегі Velora Aria матрасы" : "Матрас Velora Aria в светлой спальне"} fill sizes="(max-width: 760px) 100vw, 60vw" preload/>
 <Link className="image-caption" href={`/${locale}/catalog/2602`}><span><small>VELORA</small>Aria</span><span>{kk ? "Модельді көру" : "Смотреть модель"}<ArrowUpRight size={20}/></span></Link></div>
 </section>
 <section className="container section about-section" id="about"><p className="eyebrow">{t.aboutEyebrow}</p>
 <div className="about-grid"><h2>{kk ? <>Жатын бөлмедегі<br/><em>ең маңызды таңдау.</em></> : <>Главное в спальне —<br/><em>как вам спится.</em></>}</h2>
 <div className="about-copy"><p className="about-lead">{kk ? "Матрас күн сайын жайлы болуы керек. Сондықтан таңдауды оның ішкі құрамынан бастаған дұрыс." : "Матрас выбирают на каждый день. Поэтому за красивым чехлом важно увидеть то, что внутри."}</p>
 <p>{kk ? "Velora коллекциясында серіппесіз және тәуелсіз серіппелері бар модельдер бар. Құрамын, биіктігін және бағасын ашық көрсетеміз. Ал таңдауға қиналсаңыз, бізге хабарласыңыз." : "В коллекции Velora есть модели на пенной основе и с независимыми пружинами. Мы показываем состав, высоту и стоимость каждой. А если сложно определиться — поможем разобраться."}</p>
 <Link className="text-link" href="#contacts">{kk ? "Бізбен кеңесу" : "Посоветоваться с нами"}<ArrowUpRight size={17}/></Link></div></div></section>
 <section className="container section collection-intro" id="collection">
 <div className="section-heading"><div><p className="eyebrow">{t.collection}</p><h2>{kk ? "Өзіңізге жайлысын табыңыз." : "Найдите свой."}</h2></div><Link className="text-link" href={`/${locale}/catalog`}>{t.collectionLink}<ArrowUpRight size={18}/></Link></div>
 <div className="collection-lines">{products.map((product,i)=><Link key={product.model} className="collection-line" href={`/${locale}/catalog/${product.model}`} aria-label={productTitle(product)}>
 <div className="collection-photo"><ProductPhoto photo={productPhotos[product.model][0]} alt={productTitle(product)} sizes="(max-width: 760px) 100vw, 50vw"/><span className="collection-number">0{i+1}</span></div>
 <div className="collection-heading"><h3>{product.name}</h3><ArrowUpRight size={25} strokeWidth={1.3}/></div><p>{product.description[locale]}</p><div className="collection-detail"><span>{product.height} {t.cm}</span><span>{!kk && "от "}{formatPrice(Math.min(...product.variants.map(v=>v.priceKzt)))}{kk && "-ден бастап"}</span></div></Link>)}</div></section>
 <section className="hero hero-scroll construction-section" id="product"><div className="container hero-grid">
 <div className="construction-copy"><p className="eyebrow">{t.productEyebrow}</p><h2>{kk ? <>Жайлылық<br/><em>неден құралады?</em></> : <>Комфорт.<br/><em>Слой за слоем.</em></>}</h2><p>{kk ? "Модельді таңдап, матрас қабаттарын ашып көріңіз. Әр қабатты бассаңыз, оның сипаттамасы шығады." : "Выберите модель и загляните под чехол. Нажмите на слой, чтобы узнать, из чего он сделан."}</p>
 <div className="construction-notes"><p><strong>{t.foamStoryTitle}</strong>{t.foamStoryText}</p><p><strong>{t.springStoryTitle}</strong>{t.springStoryText}</p></div></div>
 <div className="hero-art hero-cutaway-art"><HeroCutaway locale={locale} products={products}/></div></div></section>
 <section className="container section approach-editorial" id="approach"><div className="approach-image"><Image src="/products/alba-detail.jpg" alt={kk ? "Velora Alba матрасы" : "Матрас Velora Alba"} fill sizes="(max-width: 760px) 100vw, 45vw"/></div>
 <div className="approach-copy"><p className="eyebrow">{t.detailEyebrow}</p><h2>{kk ? "Үш нәрсеге назар аударыңыз." : "Три вещи перед покупкой."}</h2><div className="guide-grid">{[[t.step1,t.step1Text],[t.step2,t.step2Text],[t.step3,t.step3Text]].map(([title,text],i)=><article className="guide-card" key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
 <HomepageMedia locale={locale}/><StorePresence locale={locale}/>
 <section className="container faq-section section"><p className="eyebrow">{t.faqEyebrow}</p><h2>{t.faq}</h2><div className="faq-list">{[[t.faq1,t.answer1],[t.faq2,t.answer2],[t.faq3,t.answer3]].map(([q,a])=><details key={q}><summary>{q}<ArrowDown size={18}/></summary><p>{a}</p></details>)}</div></section>
 <HomepageReviews locale={locale}/><StoreContacts locale={locale} contacts={settings}/>
 </main>;
}
