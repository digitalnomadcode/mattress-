import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "./db";
import { BusinessError } from "./errors";

export type Tx = Prisma.TransactionClient;
export async function warehouseLock(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(170031102026::bigint)`;
}

export async function operation<T>(kind: string, key: string, payload: unknown, work: (tx: Tx) => Promise<T>): Promise<T> {
  if (!/^[A-Za-z0-9:_-]{8,180}$/.test(key)) throw new BusinessError("INVALID_OPERATION_KEY");
  const fingerprint = createHash("sha256").update(JSON.stringify({ kind, payload })).digest("hex");
  return getDb().$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    const saved = await tx.operation.findUnique({ where: { key } });
    if (saved) {
      if (saved.kind !== kind || saved.fingerprint !== fingerprint) throw new BusinessError("IDEMPOTENCY_CONFLICT", 409);
      return saved.result as T;
    }
    const result = await work(tx);
    await tx.operation.create({ data: { key, kind, fingerprint, result: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue } });
    return result;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function consumeRateLimit(key: string, maximum: number, seconds: number) {
  const hash = createHash("sha256").update(key).digest("hex");
  const rows = await getDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
    VALUES (${hash}, 1, now() + ${seconds} * interval '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= now() THEN now() + ${seconds} * interval '1 second' ELSE "RateLimitBucket"."expiresAt" END
    RETURNING "count"`;
  if (rows[0].count > maximum) throw new BusinessError("TOO_MANY_REQUESTS", 429);
}
