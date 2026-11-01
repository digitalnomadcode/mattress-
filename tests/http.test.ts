import test from "node:test";
import assert from "node:assert/strict";
import {sameOrigin} from "../src/server/http";

test("origin check uses the public URL when Next.js normalizes its internal host",()=>{
 const previous=process.env.NEXTAUTH_URL;process.env.NEXTAUTH_URL="https://shop.example.test";
 try{
  assert.doesNotThrow(()=>sameOrigin(new Request("http://localhost:3000/api/orders",{headers:{origin:"https://shop.example.test"}})));
  for(const origin of ["https://attacker.example.test","null","http://localhost:3000"]){
   assert.throws(()=>sameOrigin(new Request("http://localhost:3000/api/orders",{headers:{origin,"x-forwarded-host":"attacker.example.test"}})),/INVALID_ORIGIN/);
  }
  assert.throws(()=>sameOrigin(new Request("http://localhost:3000/api/orders")),/INVALID_ORIGIN/);
 }finally{if(previous===undefined)delete process.env.NEXTAUTH_URL;else process.env.NEXTAUTH_URL=previous;}
});
