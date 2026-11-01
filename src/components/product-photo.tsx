import Image from "next/image";
import type {ProductPhoto as Photo} from "@/lib/product-photos";

export function ProductPhoto({photo,alt,sizes,preload=false}:{photo:Photo;alt:string;sizes:string;preload?:boolean}){
 return <Image src={photo.src} alt={alt} fill sizes={sizes} preload={preload} style={{objectFit:photo.fit,objectPosition:photo.position}}/>;
}
