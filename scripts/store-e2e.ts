import {spawn} from "node:child_process";
import {randomBytes,randomUUID} from "node:crypto";
import {setTimeout as pause} from "node:timers/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {isolatedDatabase} from "../tests/support/database";
import {getDb} from "../src/server/db";
import {seedStore} from "../src/server/seed";
import {hashPassword} from "../src/server/password";

async function main(){
const fixture=await isolatedDatabase();
const base="http://127.0.0.1:3100";
const password=randomBytes(24).toString("base64url");
let child:ReturnType<typeof spawn>|undefined;
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
 await seedStore();
 const owner=await getDb().adminUser.create({data:{email:"owner@example.test",role:"OWNER",passwordHash:await hashPassword(password)}});
 await getDb().adminUser.create({data:{email:"warehouse@example.test",role:"WAREHOUSE",passwordHash:await hashPassword(password)}});
 child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3100"],{env:{...process.env,DATABASE_URL:fixture.url,NEXTAUTH_URL:base},stdio:"ignore"});
 let ready=false;for(let i=0;i<60;i++){if(child.exitCode!==null)throw new Error("Test web server exited before readiness");try{const response=await fetch(`${base}/api/auth/providers`);if(response.ok){ready=true;break;}}catch{}await pause(250);}
 assert(ready,"Test server must become ready");
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const customer=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await customer.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 assert.equal((await customer.request.get(`${base}/api/admin`)).status(),401);
 await page.goto(`${base}/kk/catalog/2601`);await page.getByText("160 × 200 см",{exact:true}).click();
 await page.getByRole("button",{name:"Себетке қосу",exact:true}).click();
 await page.getByRole("link",{name:"Себет: 1",exact:true}).click();await page.waitForURL("**/kk/cart");
 assert((await page.locator(".cart-total").innerText()).replace(/\s/g,"").includes("149990₸"));
 await page.locator('[name="name"]').fill("Test Buyer");await page.locator('[name="phone"]').fill("+77000000002");await page.locator('[name="deliveryMethod"]').selectOption("PICKUP");
 if(process.env.STORE_SCREENSHOT_PREFIX)await page.screenshot({path:`${process.env.STORE_SCREENSHOT_PREFIX}-cart.png`,fullPage:true});
 const orderResponse=page.waitForResponse(response=>response.url()===`${base}/api/orders`&&response.request().method()==="POST");
 await page.getByRole("button",{name:"Тапсырыс қалдыру",exact:true}).click();
 const savedResponse=await orderResponse;assert.equal(savedResponse.status(),201,await savedResponse.text());
 await page.getByRole("heading",{name:"Тапсырысыңыз сақталды",exact:true}).waitFor();
 const wa=await page.getByRole("link",{name:"Тапсырысты WhatsApp-қа жіберу",exact:true}).getAttribute("href");assert(wa);assert(wa.startsWith("https://wa.me/77058216103?text="));assert(decodeURIComponent(wa).includes("Велора Luna"));
 assert.equal(await getDb().order.count(),1);const order=await getDb().order.findFirstOrThrow();
 const balance=await getDb().inventoryBalance.findFirstOrThrow({where:{variant:{sku:"CK2601-160x200"}}});assert.equal(balance.reserved,0);
 if(process.env.STORE_SCREENSHOT_PREFIX)await page.screenshot({path:`${process.env.STORE_SCREENSHOT_PREFIX}-receipt.png`,fullPage:true});
 const admin=await browser.newContext({viewport:{width:1440,height:1100}});const adminPage=await admin.newPage();adminPage.on("pageerror",e=>errors.push(e.message));
 await adminPage.goto(`${base}/admin/login`);await adminPage.locator('[name="email"]').fill("owner@example.test");await adminPage.locator('[name="password"]').fill(password);await adminPage.getByRole("button",{name:"Кіру",exact:true}).click();await adminPage.waitForURL("**/admin");
 await adminPage.getByRole("button",{name:"Тапсырыстар",exact:true}).click();
 await adminPage.getByRole("button",{name:"Расталды",exact:true}).click();await adminPage.locator(".order-head span").filter({hasText:"Расталды"}).waitFor();
 assert.equal((await getDb().inventoryBalance.findUniqueOrThrow({where:{variantId:balance.variantId}})).reserved,1);
 await adminPage.getByRole("button",{name:"Жеткізілді",exact:true}).click();await adminPage.locator(".order-head span").filter({hasText:"Жеткізілді"}).waitFor();
 const delivered=await getDb().inventoryBalance.findUniqueOrThrow({where:{variantId:balance.variantId}});assert.equal(delivered.onHand,5);assert.equal(delivered.reserved,0);
 const replay=await admin.request.post(`${base}/api/admin`,{headers:{origin:base,"idempotency-key":randomUUID()},data:{action:"transition",data:{orderId:order.id,status:"DELIVERED",version:1}}});assert.equal(replay.status(),200);
 assert.equal(await getDb().stockMovement.count({where:{type:"SALE"}}),1);
 const csrf=await admin.request.post(`${base}/api/admin`,{headers:{origin:"https://example.invalid","idempotency-key":randomUUID()},data:{action:"transition",data:{orderId:order.id,status:"CANCELLED",version:2}}});assert.equal(csrf.status(),403);
 const file=await admin.request.get(`${base}/api/admin/export`);assert.equal(file.status(),200);assert(file.headers()["content-type"].includes("spreadsheetml"));assert.equal((await file.body()).subarray(0,2).toString(),"PK");
 await adminPage.getByRole("button",{name:"Шолу",exact:true}).click();
 assert((await adminPage.locator(".metric-grid").innerText()).replace(/\s/g,"").includes("149990₸"));
 if(process.env.STORE_SCREENSHOT_PREFIX)await adminPage.screenshot({path:`${process.env.STORE_SCREENSHOT_PREFIX}-admin.png`,fullPage:true});
 const worker=await browser.newContext();const workerPage=await worker.newPage();await workerPage.goto(`${base}/admin/login`);await workerPage.locator('[name="email"]').fill("warehouse@example.test");await workerPage.locator('[name="password"]').fill(password);await workerPage.getByRole("button",{name:"Кіру",exact:true}).click();await workerPage.waitForURL("**/admin");
 const denied=await worker.request.post(`${base}/api/admin`,{headers:{origin:base,"idempotency-key":randomUUID()},data:{action:"variant",data:{variantId:balance.variantId,priceKzt:1,heightCm:25,active:true}}});assert.equal(denied.status(),403);
 const workerData=await (await worker.request.get(`${base}/api/admin`)).json();assert.deepEqual(workerData.orders,[]);
 await getDb().adminUser.update({where:{id:owner.id},data:{disabled:true}});assert.equal((await admin.request.get(`${base}/api/admin`)).status(),401);
 assert.deepEqual(errors,[]);
 console.log("PASS: real browser checkout, server prices, persisted order, WhatsApp composition, authenticated confirmation/delivery, one sale on replay, CSRF rejection, Excel export, warehouse access restrictions and disabled-user session revocation. All data stayed in an isolated test schema.");
}finally{
 await browser?.close();
 if(child&&child.exitCode===null){child.kill("SIGTERM");await Promise.race([new Promise(resolve=>child!.once("exit",resolve)),pause(5000)]);if(child.exitCode===null)child.kill("SIGKILL");}
 await getDb().$disconnect();await fixture.cleanup();
}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
