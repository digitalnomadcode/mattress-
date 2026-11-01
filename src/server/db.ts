import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { veloraDb?: PrismaClient };
// A dedicated shop connection can coexist with a provider-managed DATABASE_URL.
export function databaseUrl(){return process.env.VELORA_DATABASE_URL||process.env.DATABASE_URL;}
export function getDb() {
  const connectionString=databaseUrl();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  if (!globalDb.veloraDb) {
    const url = new URL(connectionString);
    const schema = url.searchParams.get("schema") || "public";
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(schema)) throw new Error("Invalid database schema");
    const adapter = new PrismaPg({ connectionString, max: 8, ...(schema!=="public"?{options:`-c search_path=${schema}`}:{}) }, { schema });
    globalDb.veloraDb = new PrismaClient({ adapter });
  }
  return globalDb.veloraDb;
}
export type Db = ReturnType<typeof getDb>;
