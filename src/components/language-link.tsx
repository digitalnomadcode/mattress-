"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";

export function LanguageLink({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const other = locale === "ru" ? "kk" : "ru";
  const current = locale === "ru" ? "РУС" : "ҚАЗ";
  const link = <Link className="language-link" href={pathname.replace(/^\/(ru|kk)(?=\/|$)/, `/${other}`)} lang={other} hrefLang={other}>{label}</Link>;
  const active = <span className="language-current" lang={locale} aria-current="page">{current}</span>;
  return <div className="language-switch" role="group" aria-label={dictionary(locale).languageChoice}>
    {locale === "ru" ? active : link}<span aria-hidden="true">/</span>{locale === "kk" ? active : link}
  </div>;
}
