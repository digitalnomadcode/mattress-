import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin } from "lucide-react";
import { localeSchema } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";
import { LanguageLink } from "@/components/language-link";
import { BrandLogo } from "@/components/brand-logo";
import localFont from "next/font/local";
import { CartLink } from "@/components/cart-link";
import "../globals.css";
import "../velora.css";
import "../cutaway.css";
import "../commerce.css";

export const dynamic = "force-dynamic";

const veloraSans = localFont({
  src: [
    { path: "../fonts/DejaVuSans.woff", weight: "400", style: "normal" },
    { path: "../fonts/DejaVuSans-Bold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-velora",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) return {};
  const t = dictionary(parsed.data);
  return {
    title: { default: t.metaHomeTitle, template: "%s | Велора" },
    description: t.metaDescription,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() { return [{ locale: "ru" }, { locale: "kk" }]; }

export default async function LocaleLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ locale: string }>;
}) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data;
  const t = dictionary(locale);
  return (
    <html lang={locale} className={veloraSans.variable}>
      <body>
        <a href="#main" className="skip-link">{t.skip}</a>
        <div className="topline"><div className="container topline-inner"><span><MapPin size={12} /> {t.location}</span><span>{t.preview}</span></div></div>
        <header className="header"><div className="container nav">
          <Link className="brand-link" href={`/${locale}`} aria-label="VELORA"><BrandLogo locale={locale}/></Link>
          <nav aria-label={t.catalog} className="nav-links">
            <Link href={`/${locale}#about`}>{t.about}</Link>
            <Link href={`/${locale}/catalog`}>{t.catalog}</Link>
            <Link href={`/${locale}#approach`}>{t.approach}</Link>
            <Link href={`/${locale}#locations`}>{t.locations}</Link>
            <Link href={`/${locale}#contacts`}>{t.contacts}</Link>
          </nav>
          <div className="nav-end"><LanguageLink locale={locale} label={t.language} /><CartLink locale={locale}/><Link className="nav-cta" href={`/${locale}/catalog`}>{t.browse}<ArrowUpRight size={16}/></Link></div>
        </div></header>
        {children}
        <footer><div className="container footer-inner"><Link className="brand-link" href={`/${locale}`} aria-label="VELORA"><BrandLogo locale={locale}/></Link><div className="footer-copy"><p className="footer-tagline">{t.brandTagline}</p><p>{t.footer}</p></div><span>РУС / ҚАЗ</span></div></footer>
      </body>
    </html>
  );
}
