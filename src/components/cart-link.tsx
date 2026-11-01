"use client";
import Link from "next/link";
import {ShoppingBag} from "lucide-react";
import {useCart} from "./cart-store";
import {shopCopy} from "@/lib/shop-copy";
import type {Locale} from "@/lib/catalog";
export function CartLink({locale}:{locale:Locale}){const items=useCart();const count=items.reduce((s,i)=>s+i.quantity,0);return <Link className="cart-link" href={`/${locale}/cart`} aria-label={`${shopCopy(locale).cart}: ${count}`}><ShoppingBag size={18}/><span>{count}</span></Link>;}
