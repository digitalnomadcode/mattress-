import { z } from "zod";
import { getDb } from "../src/server/db";
import { hashPassword } from "../src/server/password";

async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const password = z.string().min(12).max(200).parse(process.env.ADMIN_PASSWORD);
  // Never reset an existing account's password or role implicitly.
  const existing = await getDb().adminUser.findUnique({ where: { email } });
  if (existing) { console.log("Administrator already exists; no changes made."); return; }
  await getDb().adminUser.create({ data: { email, role: "OWNER", passwordHash: await hashPassword(password) } });
  console.log("Administrator created. Credential values were not printed.");
}
main().catch(() => { console.error("Administrator creation failed. Check DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD (12–200 characters) in protected environment settings; values were not printed.");process.exitCode=1; }).finally(() => getDb().$disconnect());
