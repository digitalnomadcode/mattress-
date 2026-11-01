import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BusinessError } from "./errors";

export function sameOrigin(request:Request) {
  // Next.js may normalize an internal URL to localhost behind a proxy.
  // Compare with the configured public origin, never a caller-supplied forwarded host.
  const expected=new URL(process.env.NEXTAUTH_URL||request.url).origin;
  if(request.headers.get("origin")!==expected) throw new BusinessError("INVALID_ORIGIN",403);
}
export async function bodyJson(request:Request) {
  if(!request.headers.get("content-type")?.includes("application/json")) throw new BusinessError("INVALID_CONTENT_TYPE",415);
  const text=await request.text();
  if(text.length>30000) throw new BusinessError("BODY_TOO_LARGE",413);
  try{return JSON.parse(text) as unknown;}catch{throw new BusinessError("INVALID_JSON");}
}
export function apiError(error:unknown) {
  if(error instanceof ZodError) return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  if(error instanceof BusinessError) return NextResponse.json({error:error.code},{status:error.status});
  console.error("Request failed",error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({error:"SERVER_ERROR"},{status:503});
}
