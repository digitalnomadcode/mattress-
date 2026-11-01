"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { formatPrice, type Locale, type Product } from "@/lib/catalog";
import { dictionary } from "@/lib/dictionary";
import { shopCopy } from "@/lib/shop-copy";
import { PurchaseControls } from "./purchase-controls";

export function VariantSelector({ product, locale, whatsappNumber }: { product: Product; locale: Locale; whatsappNumber: string | null }) {
  const [sku, setSku] = useState(product.variants[0].sku);
  const variant = product.variants.find(v => v.sku === sku)!;
  const t = dictionary(locale);
  const shop = shopCopy(locale);
  return <div className="variant-selector">
    <fieldset><legend>{t.sizeChoice}</legend><div className="size-options">{product.variants.map(v => <label key={v.sku} className={sku === v.sku ? "size-option selected" : "size-option"}>
      <input type="radio" name="size" value={v.sku} checked={sku === v.sku} onChange={() => setSku(v.sku)}/><span>{v.width} × {v.length} {t.cm}</span>
    </label>)}</div></fieldset>
    <div className="detail-height" aria-live="polite"><span>{t.height}</span><strong>{variant.height} {t.cm}</strong></div>
    <div className="detail-price" aria-live="polite"><strong>{formatPrice(variant.priceKzt)}</strong><small>{variant.sku}</small></div>
    <p className="price-note">{t.priceNote}</p>
    <div className="availability"><Info size={17}/><span>{variant.allocationPending ? shop.clarify : variant.available !== undefined ? `${shop.available}: ${variant.available}` : t.availability}</span></div>
    <PurchaseControls key={variant.sku} product={product} variant={variant} locale={locale} whatsappNumber={whatsappNumber}/>
  </div>;
}
