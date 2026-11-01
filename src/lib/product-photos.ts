import type {ModelCode} from "./catalog";

export type ProductPhoto={src:string;fit:"cover"|"contain";position:string};
// Owner-provided originals. Keep model mapping independent from filename colours.
// The Luna viewport uses the lower part of the photo; its source is not retouched.
export const productPhotos:Record<ModelCode,ProductPhoto[]>={
 "2601":[{src:"/products/luna.jpg",fit:"cover",position:"center bottom"}],
 "2602":[{src:"/products/aria.jpg",fit:"cover",position:"center 65%"},{src:"/products/aria-detail.jpg",fit:"contain",position:"center"}],
 "2603":[{src:"/products/vita-detail.jpg",fit:"cover",position:"center 75%"},{src:"/products/vita.jpg",fit:"contain",position:"center"}],
 "2605":[{src:"/products/alba-detail.jpg",fit:"cover",position:"center 70%"},{src:"/products/alba.jpg",fit:"contain",position:"center"}],
 "2606":[{src:"/products/oro.jpg",fit:"cover",position:"center 76%"}],
};
