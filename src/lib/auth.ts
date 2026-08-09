import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "euganeo_session";

export type AppUser = { id: string; name: string; passwordEnvVar: string };

export const APP_USERS: AppUser[] = [
  { id: "nicolo", name: "Nicolò", passwordEnvVar: "APP_PASSWORD_NICOLO" },
  { id: "jessica", name: "Jessica", passwordEnvVar: "APP_PASSWORD_JESSICA" },
];

export function findUser(userId: string | undefined) {
  return APP_USERS.find((user) => user.id === userId);
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

export function createSessionValue(userId: string) {
  const signature = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

export function verifySessionValue(value: string | undefined): AppUser | null {
  if (!value) return null;
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const userId = value.slice(0, separatorIndex);
  const user = findUser(userId);
  if (!user) return null;
  const expected = createSessionValue(userId);
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? user : null;
}

export async function isAuthenticated() {
  return Boolean(await getSessionUser());
}

export async function getSessionUser() {
  return verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

export function safePasswordMatch(userId: string, candidate: string) {
  const user = findUser(userId);
  if (!user) return false;
  const expected = process.env[user.passwordEnvVar] || "";
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return expected.length >= 16 && a.length === b.length && timingSafeEqual(a, b);
}
