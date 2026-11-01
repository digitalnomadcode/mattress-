import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, appendFileSync, writeFileSync, chmodSync } from "node:fs";
import { parse } from "dotenv";

// Local development only. Existing values are preserved and never printed.
const path = ".env.local";
const existing = existsSync(path) ? parse(readFileSync(path)) : {};
const password = existing.DB_LOCAL_PASSWORD || randomBytes(24).toString("hex");
const defaults = {
  DB_LOCAL_PASSWORD: password,
  DATABASE_URL: `postgresql://velora:${password}@127.0.0.1:5432/velora_store?schema=public`,
  AUTH_SECRET: randomBytes(48).toString("hex"),
  NEXTAUTH_URL: "http://localhost:3000",
};
const additions = Object.entries(defaults).filter(([key]) => !existing[key] && !process.env[key]).map(([key, value]) => `${key}=${value}`).join("\n");
if (additions) {
  if (existsSync(path)) appendFileSync(path, `\n${additions}\n`, { mode: 0o600 });
  else writeFileSync(path, `${additions}\n`, { mode: 0o600, flag: "wx" });
  chmodSync(path, 0o600);
}
console.log("Local database configuration prepared in ignored .env.local; credential values were not printed. No administrator account was created.");
