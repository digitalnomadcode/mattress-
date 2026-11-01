import {readdir} from "node:fs/promises";
import {getDb} from "../src/server/db";
import {normalizePhone} from "../src/lib/commerce";

// Read-only release check. Supply the intended deployment's protected environment.
// Never load a development .env.local implicitly or print configuration values.
async function main(){
 const problems:string[]=[];
 const fail=(message:string)=>problems.push(message);
 let database:URL|undefined,origin:URL|undefined;
 try{database=new URL(process.env.DATABASE_URL||"");}catch{fail("DATABASE_URL is missing or invalid.");}
 try{origin=new URL(process.env.NEXTAUTH_URL||"");}catch{fail("NEXTAUTH_URL is missing or invalid.");}
 if(database){
  if(!["postgres:","postgresql:"].includes(database.protocol))fail("DATABASE_URL must use PostgreSQL.");
  if(["localhost","127.0.0.1","[::1]"].includes(database.hostname))fail("A production release requires a separate external database.");
  if(!["require","verify-ca","verify-full"].includes(database.searchParams.get("sslmode")||""))fail("The production database connection must require TLS.");
 }
 if(origin&&(origin.protocol!=="https:"||origin.pathname!=="/"||origin.search||origin.hash||origin.username||origin.password||["localhost","127.0.0.1","[::1]"].includes(origin.hostname)))fail("NEXTAUTH_URL must be the exact public HTTPS origin.");
 if((process.env.AUTH_SECRET||process.env.NEXTAUTH_SECRET||"").length<32)fail("A signing secret of at least 32 characters is required.");
 if(problems.length){for(const problem of problems)console.error(`NOT READY: ${problem}`);process.exitCode=1;return;}
 const db=getDb();
 try{
  const migrations=await db.$queryRaw<{migration_name:string;finished_at:Date|null;rolled_back_at:Date|null}[]>`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
  const expected=(await readdir("prisma/migrations")).filter(name=>/^\d/.test(name));
  if(expected.some(name=>!migrations.some(m=>m.migration_name===name&&m.finished_at&&!m.rolled_back_at))||migrations.some(m=>!m.finished_at&&!m.rolled_back_at))fail("Required migrations are missing or unfinished.");
  await db.$transaction(async tx=>{
   if(!await tx.adminUser.count({where:{role:"OWNER",disabled:false,passwordHash:{not:null}}}))fail("Create an enabled owner with a protected password before opening checkout.");
   if(!await tx.product.count({where:{published:true,variants:{some:{active:true,priceKzt:{gt:0}}}}}))fail("Seed and publish at least one priced product.");
   const settings=await tx.storeSettings.findUnique({where:{id:"store"}});
   if(!settings||!normalizePhone(settings.whatsappNumber||"")||!normalizePhone(settings.phoneNumber||"")||!settings.instagramUsername)fail("Store contact settings are incomplete.");
   const differences=await tx.$queryRaw<{count:bigint}[]>`SELECT count(*)::bigint AS count FROM "InventoryBalance" b WHERE b."onHand" <> COALESCE((SELECT sum(m."quantityDelta") FROM "StockMovement" m WHERE m."variantId"=b."variantId"),0) OR b."reserved" <> COALESCE((SELECT sum(r.quantity) FROM "StockReservation" r WHERE r."variantId"=b."variantId" AND r.status='ACTIVE'),0)`;
   const unknown=await tx.$queryRaw<{count:bigint}[]>`SELECT count(*)::bigint AS count FROM "UnallocatedStock" u WHERE u.quantity <> COALESCE((SELECT sum(m."quantityDelta") FROM "StockMovement" m WHERE m."unallocatedStockId"=u.id),0)`;
   if(Number(differences[0].count)||Number(unknown[0].count))fail("Stock, reservations and movement journal do not reconcile.");
  },{isolationLevel:"RepeatableRead"});
  if(problems.length){for(const problem of problems)console.error(`NOT READY: ${problem}`);process.exitCode=1;return;}
  console.log("PASS: deployment configuration, migrations, owner access, contacts and stock reconciliation. No data was changed. This does not publish the site or approve content.");
 }finally{await db.$disconnect();}
}
main().catch(()=>{console.error("NOT READY: database checks could not complete. Verify the protected connection and deployed migrations; credential values were not printed.");process.exitCode=1;});
