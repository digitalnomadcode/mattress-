import test from "node:test";
import assert from "node:assert/strict";
import {databaseUrl} from "../src/server/db";
import {isolatedDatabase} from "./support/database";

test("dedicated shop connection takes precedence without changing the integration binding",()=>{
 const original=process.env.DATABASE_URL,override=process.env.VELORA_DATABASE_URL;
 try{
  process.env.DATABASE_URL="postgresql://integration.example.test/legacy";
  process.env.VELORA_DATABASE_URL="postgresql://shop.example.test/shop";
  assert.equal(databaseUrl(),"postgresql://shop.example.test/shop");
  assert.equal(process.env.DATABASE_URL,"postgresql://integration.example.test/legacy");
  delete process.env.VELORA_DATABASE_URL;assert.equal(databaseUrl(),process.env.DATABASE_URL);
 }finally{if(original===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=original;if(override===undefined)delete process.env.VELORA_DATABASE_URL;else process.env.VELORA_DATABASE_URL=override;}
});

test("integration tests refuse a deployment override before opening any connection",async()=>{
 const original=process.env.VELORA_DATABASE_URL;
 try{process.env.VELORA_DATABASE_URL="postgresql://shop.example.test/shop";await assert.rejects(isolatedDatabase(),/deployment database override/);}
 finally{if(original===undefined)delete process.env.VELORA_DATABASE_URL;else process.env.VELORA_DATABASE_URL=original;}
});
