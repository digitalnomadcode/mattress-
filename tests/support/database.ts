import {randomBytes} from "node:crypto";
import {readFile,readdir} from "node:fs/promises";
import {Client} from "pg";

export async function isolatedDatabase(){
 if(process.env.VELORA_DATABASE_URL)throw new Error("Refusing integration tests while a deployment database override is configured");
 const original=process.env.DATABASE_URL;
 if(!original)throw new Error("Local DATABASE_URL required for integration tests");
 const url=new URL(original);if(!["127.0.0.1","localhost"].includes(url.hostname))throw new Error("Integration tests require local PostgreSQL; refusing external database");
 const schema=`velora_test_${randomBytes(8).toString("hex")}`;
 const client=new Client({connectionString:original});await client.connect();
 await client.query(`CREATE SCHEMA "${schema}"`);await client.query(`SET search_path TO "${schema}"`);
 for(const name of (await readdir("prisma/migrations")).filter(n=>/^\d/.test(n)).sort()){
  const sql=await readFile(`prisma/migrations/${name}/migration.sql`,"utf8");
  await client.query(sql.replace('CREATE SCHEMA IF NOT EXISTS "public";',""));
 }
 url.searchParams.set("schema",schema);process.env.DATABASE_URL=url.href;
 return {url:url.href,schema,async cleanup(){if(!/^velora_test_[a-f0-9]{16}$/.test(schema))throw new Error("Invalid test schema");await client.query(`DROP SCHEMA "${schema}" CASCADE`);await client.end();process.env.DATABASE_URL=original;}};
}
