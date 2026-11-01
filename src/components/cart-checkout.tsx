"use client";
import {useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {useCart,writeCart} from "./cart-store";
import {products as initialProducts,formatPrice,productTitle,type Product,type Locale} from "@/lib/catalog";
import {shopCopy,shopError} from "@/lib/shop-copy";
import {normalizePhone} from "@/lib/commerce";

type Receipt={id:string;number:number;totalKzt:number;items:{sku:string;title:string;quantity:number;unitPriceKzt:number}[]};
export function CartCheckout({locale,products=initialProducts,whatsappNumber,deliveryText="",pickupAddress=""}:{locale:Locale;products?:Product[];whatsappNumber:string|null;deliveryText?:string;pickupAddress?:string}){
 const t=shopCopy(locale);const items=useCart();const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [method,setMethod]=useState("DELIVERY");
 const [receipt,setReceipt]=useState<Receipt|null>(null);const [message,setMessage]=useState("");const submission=useRef({payload:"",key:""});
 const rows=items.map(item=>{const product=products.find(p=>p.variants.some(v=>v.sku===item.sku));const variant=product?.variants.find(v=>v.sku===item.sku);return{...item,product,variant};});
 const total=rows.reduce((s,i)=>s+(i.variant?.priceKzt||0)*i.quantity,0);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;setError("");setBusy(true);
  const f=new FormData(event.currentTarget);const payload={customerName:String(f.get("name")||""),phone:String(f.get("phone")||""),locale,deliveryMethod:method,city:f.get("city"),address:String(f.get("address")||""),note:String(f.get("note")||""),items};
  const serialized=JSON.stringify(payload);if(submission.current.payload!==serialized)submission.current={payload:serialized,key:crypto.randomUUID()};
  try{const response=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json","idempotency-key":submission.current.key},body:serialized});const data=await response.json();if(!response.ok){setError(shopError(data.error||"SERVER_ERROR",locale));return;}
   const saved=data as Receipt;setReceipt(saved);setMessage(`${locale==="kk"?"Сәлеметсіз бе! Тапсырыс қалдырдым.":"Здравствуйте! Оставил(а) заявку."}\n${t.orderNumber}: ${saved.number}\n${payload.customerName} · ${normalizePhone(payload.phone)}\n${saved.items.map(i=>`${i.title} · ${i.sku} × ${i.quantity} = ${formatPrice(i.quantity*i.unitPriceKzt)}`).join("\n")}\n${t.total}: ${formatPrice(saved.totalKzt)}\n${payload.city==="ALMATY"?"Алматы":"Астана"} · ${method==="DELIVERY"?t.delivery:t.pickup}\n${payload.address}\n${payload.note}`);writeCart([]);
  }catch{setError(t.SERVER_ERROR);}finally{setBusy(false);}
 }
 const phone=normalizePhone(whatsappNumber||"").replace(/^\+/,"");
 if(receipt)return <section className="checkout-success"><p className="eyebrow">VELORA</p><h1>{t.success}</h1><strong>{t.orderNumber}: {receipt.number}</strong><p>{t.successText}</p><p>{t.total}: {formatPrice(receipt.totalKzt)}</p>{phone&&<a className="button primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}>{t.sendOrder}</a>}<Link href={`/${locale}/catalog`}>{t.continue}</Link></section>;
 if(!items.length)return <section className="cart-empty"><h1>{t.cart}</h1><p>{t.empty}</p><Link className="button primary" href={`/${locale}/catalog`}>{t.browse}</Link></section>;
 return <><h1>{t.cart}</h1><div className="checkout-grid"><section className="cart-items">{rows.map(item=><article key={item.sku} className="cart-row"><div><h2>{item.product?productTitle(item.product):item.sku}</h2><p>{item.variant?`${item.variant.width} × ${item.variant.length} см`:t.unavailable}</p><button type="button" onClick={()=>writeCart(items.filter(i=>i.sku!==item.sku))}>{t.remove}</button></div><label>{t.quantity}<input type="number" min="1" max="99" aria-label={`${t.quantity}: ${item.sku}`} value={item.quantity} onChange={e=>writeCart(items.map(i=>i.sku===item.sku?{...i,quantity:Math.max(1,Math.min(99,Number(e.target.value)||1))}:i))}/></label><strong>{formatPrice((item.variant?.priceKzt||0)*item.quantity)}</strong></article>)}<div className="cart-total"><span>{t.total}</span><strong>{formatPrice(total)}</strong></div><p className="checkout-note">{t.deliveryNote}</p></section>
  <form className="checkout-form" onSubmit={submit}><h2>{t.checkout}</h2>
   {deliveryText&&<p className="checkout-note">{deliveryText}</p>}
   {method==="PICKUP"&&pickupAddress&&<p className="checkout-note">{pickupAddress}</p>}
   <label>{t.name}<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>{t.phone}<input name="phone" type="tel" required maxLength={35} autoComplete="tel" placeholder="+7 …"/></label><label>{t.city}<select name="city"><option value="ALMATY">Алматы</option><option value="ASTANA">Астана</option></select></label><label>{t.method}<select name="deliveryMethod" value={method} onChange={e=>setMethod(e.target.value)}><option value="DELIVERY">{t.delivery}</option><option value="PICKUP">{t.pickup}</option></select></label>{method==="DELIVERY"&&<label>{t.address}<input name="address" required minLength={5} maxLength={500} autoComplete="street-address"/></label>}<label>{t.note}<textarea name="note" maxLength={1000}/></label><p className="checkout-note">{t.consent}</p>{error&&<p role="alert" className="form-error">{error}</p>}<button className="button primary" disabled={busy||rows.some(i=>!i.variant)}>{busy?t.sending:t.checkout}</button></form>
 </div></>;
}
