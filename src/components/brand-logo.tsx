import Image from "next/image";
import type { Locale } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";

export function BrandLogo({ locale }: { locale: Locale }) {
  const t = dictionary(locale);
  return <Image
    className="brand-logo"
    src={locale === "kk" ? "/brand/velora-logo-kk.svg" : "/brand/velora-logo.svg"}
    alt={`Velora — ${t.brandDescriptor}`}
    width={1000}
    height={390}
    priority
    unoptimized
  />;
}
