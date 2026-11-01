import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 200) throw new Error("Password must contain 12–200 characters");
  const salt = randomBytes(24).toString("hex");
  const key = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, stored] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !stored || password.length > 200) return false;
  const key = await derive(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
