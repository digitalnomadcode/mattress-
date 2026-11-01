"use client";
import {useMemo,useSyncExternalStore} from "react";

export type CartItem={sku:string;quantity:number};
const key="velora-cart-v1";
let fallback="[]";
let storageUnavailable=false;
function snapshot(){try{return storageUnavailable?fallback:localStorage.getItem(key)||"[]";}catch{return fallback;}}
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("velora-cart",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("velora-cart",callback);};}
function parse(value:string):CartItem[]{try{const items:unknown=JSON.parse(value);if(!Array.isArray(items))return[];return items.filter((i):i is CartItem=>typeof i==="object"&&i!==null&&typeof i.sku==="string"&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=99).slice(0,12);}catch{return[];}}
export function writeCart(items:CartItem[]){fallback=JSON.stringify(items);try{localStorage.setItem(key,fallback);}catch{storageUnavailable=true;}window.dispatchEvent(new Event("velora-cart"));}
export function addCart(sku:string,quantity:number){const items=parse(snapshot());const item=items.find(i=>i.sku===sku);if(item)item.quantity=Math.min(99,item.quantity+quantity);else items.push({sku,quantity});writeCart(items);}
export function useCart(){const raw=useSyncExternalStore(subscribe,snapshot,()=>"[]");return useMemo(()=>parse(raw),[raw]);}
