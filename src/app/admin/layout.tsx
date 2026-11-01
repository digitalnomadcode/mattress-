import type {Metadata} from "next";
import "../globals.css";
import "../velora.css";
import "../commerce.css";
export const metadata:Metadata={title:"Велора · Admin",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default function AdminLayout({children}:{children:React.ReactNode}){return <html lang="kk"><body>{children}</body></html>;}
