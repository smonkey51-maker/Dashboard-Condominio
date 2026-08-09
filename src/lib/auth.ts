import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "euganeo_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

export function createSessionValue() {
  const payload = "euganeo-family";
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionValue(value: string | undefined) {
  if (!value) return false;
  const expected = createSessionValue();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthenticated() {
  return verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

export function safePasswordMatch(candidate: string) {
  const expected = process.env.APP_PASSWORD || "";
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return expected.length >= 16 && a.length === b.length && timingSafeEqual(a, b);
}
