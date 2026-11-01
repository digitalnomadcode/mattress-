import {notFound} from "next/navigation";
import {localeSchema} from "@/lib/catalog";
import {getPublicProducts,getPublicSettings} from "@/server/public-data";
import {CartCheckout} from "@/components/cart-checkout";
export default async function CartPage({params}:{params:Promise<{locale:string}>}){const l=localeSchema.safeParse((await params).locale);if(!l.success)notFound();const [products,settings]=await Promise.all([getPublicProducts(),getPublicSettings()]);return <main id="main" className="container cart-page"><CartCheckout locale={l.data} products={products} whatsappNumber={settings.whatsappNumber} deliveryText={settings.delivery[l.data]} pickupAddress={settings.address[l.data]}/></main>;}
