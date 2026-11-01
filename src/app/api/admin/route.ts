import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/server/auth";
import {getAdminData} from "@/server/admin-data";
import {apiError,bodyJson,sameOrigin} from "@/server/http";
import {transitionOrder,moveStock,returnStock,allocateStock,countStock} from "@/server/commerce-service";
import {editProduct,editPrice,editSettings} from "@/server/admin-edits";
export const dynamic="force-dynamic";
export const maxDuration=30;
export async function GET(){try{const actor=await requireAdmin();return NextResponse.json(await getAdminData(actor),{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function POST(request:Request){try{
 sameOrigin(request);const actor=await requireAdmin();
 const body=z.object({action:z.enum(["transition","stock","return","allocate","count","product","variant","settings"]),data:z.unknown()}).parse(await bodyJson(request));
 const actions={transition:transitionOrder,stock:moveStock,return:returnStock,allocate:allocateStock,count:countStock,product:editProduct,variant:editPrice,settings:editSettings};
 return NextResponse.json(await actions[body.action](body.data,request.headers.get("idempotency-key")||"",actor.id));
}catch(e){return apiError(e);}}
