import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { veloraDb?: PrismaClient };
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!globalDb.veloraDb) {
    const url = new URL(process.env.DATABASE_URL);
    const schema = url.searchParams.get("schema") || "public";
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(schema)) throw new Error("Invalid database schema");
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 8, ...(schema!=="public"?{options:`-c search_path=${schema}`}:{}) }, { schema });
    globalDb.veloraDb = new PrismaClient({ adapter });
  }
  return globalDb.veloraDb;
}
export type Db = ReturnType<typeof getDb>;
