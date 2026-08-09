import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "euganeo_session";

export type AppUser = { id: string; name: string; emailEnvVar: string };

export const APP_USERS: AppUser[] = [
  { id: "nicolo", name: "Nicolò", emailEnvVar: "GOOGLE_LOGIN_EMAIL_NICOLO" },
  { id: "jessica", name: "Jessica", emailEnvVar: "GOOGLE_LOGIN_EMAIL_JESSICA" },
];

export function findUser(userId: string | undefined) {
  return APP_USERS.find((user) => user.id === userId);
}

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return APP_USERS.find((user) => {
    const allowed = (process.env[user.emailEnvVar] || "").trim().toLowerCase();
    return allowed.length > 0 && allowed === normalized;
  });
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

export function attachSession(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
