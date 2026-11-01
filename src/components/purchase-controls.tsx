"use client";
import {useState} from "react";
import {ShoppingBag,ArrowUpRight} from "lucide-react";
import {addCart} from "./cart-store";
import {shopCopy} from "@/lib/shop-copy";
import {normalizePhone} from "@/lib/commerce";
import {productTitle,type Product,type CatalogVariant,type Locale} from "@/lib/catalog";

export function PurchaseControls({product,variant,locale,whatsappNumber}:{product:Product;variant:CatalogVariant;locale:Locale;whatsappNumber:string|null}){
 const t=shopCopy(locale);const [quantity,setQuantity]=useState(1);const [added,setAdded]=useState(false);
 const phone=normalizePhone(whatsappNumber||"").replace(/^\+/,"");
 const message=`${locale==="kk"?"Сәлеметсіз бе! Осы матрас туралы білгім келеді:":"Здравствуйте! Интересует матрас:"}\n${productTitle(product)} · ${variant.width}×${variant.length} ${locale==="kk"?"см":"см"}\n${t.quantity}: ${quantity}`;
 const available=variant.available;
 return <div className="purchase-controls">
  <label>{t.quantity}<input aria-label={t.quantity} type="number" min="1" max={Math.max(1,Math.min(99,available??99))} value={quantity} onChange={e=>{setQuantity(Math.max(1,Math.min(99,Number(e.target.value)||1)));setAdded(false);}}/></label>
  <button type="button" className="button primary" disabled={available===0 || (available!==undefined&&quantity>available)} onClick={()=>{addCart(variant.sku,quantity);setAdded(true);}}><ShoppingBag size={17}/>{added?t.added:t.add}</button>
  {phone&&<a className="whatsapp-link" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}>{t.whatsapp}<ArrowUpRight size={16}/></a>}
 </div>;
}
