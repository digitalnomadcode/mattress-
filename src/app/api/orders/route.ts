import { NextResponse } from "next/server";
import { createOrder } from "@/server/commerce-service";
import { consumeRateLimit } from "@/server/operations";
import { apiError,bodyJson,sameOrigin } from "@/server/http";
export const maxDuration=30;
export async function POST(request:Request) {
  try {
    sameOrigin(request);
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0].trim()||"local";
    await consumeRateLimit(`orders:${ip}`,20,600);
    const order=await createOrder(await bodyJson(request),request.headers.get("idempotency-key")||"");
    return NextResponse.json(order,{status:201});
  } catch(error){return apiError(error);}
}
