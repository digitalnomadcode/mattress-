import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
const directory="prisma/migrations/202610310001_initial";
const path=`${directory}/migration.sql`;
if (existsSync(path) && statSync(path).size > 0) throw new Error("Initial migration already exists; refusing to overwrite it");
const result=spawnSync("npx",["prisma","migrate","diff","--from-empty","--to-schema","prisma/schema.prisma","--script"],{encoding:"utf8"});
if(result.status!==0){process.stderr.write(result.stderr);process.exit(result.status||1);}
if(!result.stdout.includes('CREATE TABLE "InventoryBalance"')) throw new Error("Prisma returned no schema SQL; migration was not written");
mkdirSync(directory,{recursive:true});
writeFileSync(path,result.stdout);
console.log("Initial migration generated from the Prisma schema.");
