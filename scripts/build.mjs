import {spawnSync} from "node:child_process";

function run(label,args){
 console.log(`Build step: ${label}`);
 const result=spawnSync(process.execPath,args,{stdio:"inherit",env:process.env});
 if(result.error){console.error(`Could not start ${label}.`);process.exit(1);}
 if(result.status!==0)process.exit(result.status||1);
}
const bootstrap=process.env.VELORA_BOOTSTRAP==="1";
if(bootstrap){
 // Explicit one-time production deployment only; ordinary previews never seed.
 let valid=false;
 try{
  const pooled=new URL(process.env.VELORA_DATABASE_URL||"");
  const direct=new URL(process.env.DIRECT_DATABASE_URL||"");
  valid=process.env.VERCEL_ENV==="production"&&[pooled,direct].every(url=>["postgres:","postgresql:"].includes(url.protocol)&&url.hostname.endsWith(".neon.tech")&&["require","verify-ca","verify-full"].includes(url.searchParams.get("sslmode")))&&Boolean(process.env.ADMIN_EMAIL)&&Boolean(process.env.ADMIN_PASSWORD);
 }catch{}
 if(!valid){console.error("Bootstrap requires an explicit production deployment, dedicated TLS Neon connections and protected owner credentials. No database changes were attempted.");process.exit(1);}
}
run("Prisma generation",["node_modules/prisma/build/index.js","generate"]);
if(bootstrap){
 run("deployment migrations",["node_modules/prisma/build/index.js","migrate","deploy"]);
 run("idempotent opening inventory",["--import","tsx","scripts/seed.ts"]);
 run("owner activation",["--import","tsx","scripts/create-admin.ts"]);
 run("read-only release checks",["--import","tsx","scripts/check-release.ts"]);
}
run("Next.js production build",["node_modules/next/dist/bin/next","build"]);
