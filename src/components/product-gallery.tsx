"use client";
import {useState} from "react";
import {productPhotos} from "@/lib/product-photos";
import type {Locale,ModelCode} from "@/lib/catalog";
import {ProductPhoto} from "./product-photo";

export function ProductGallery({model,name,locale}:{model:ModelCode;name:string;locale:Locale}){
 const photos=productPhotos[model];const [selected,setSelected]=useState(0);
 const photo=photos[selected];const label=locale==="kk"?`${name} матрасы`:`Матрас ${name}`;
 return <figure className="product-gallery">
  <div className={`product-photo-plane ${photo.fit==="contain"?"photo-contained":""}`} aria-live="polite"><ProductPhoto photo={photo} alt={label} sizes="(max-width: 768px) 95vw, 50vw" preload/></div>
  {photos.length>1&&<div className="product-photo-thumbs" role="group" aria-label={locale==="kk"?"Матрас суреттері":"Фотографии матраса"}>{photos.map((item,index)=><button type="button" key={item.src} aria-pressed={index===selected} aria-label={`${locale==="kk"?"Сурет":"Фото"} ${index+1}`} onClick={()=>setSelected(index)}><ProductPhoto photo={item} alt="" sizes="100px"/></button>)}</div>}
 </figure>;
}
