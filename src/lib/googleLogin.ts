import { google } from "googleapis";

const loginScopes = ["openid", "email"];

function loginOauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) throw new Error("Google OAuth is not configured");
  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl}/api/auth/google/callback`);
}

export function googleLoginUrl(state: string) {
  return loginOauthClient().generateAuthUrl({ scope: loginScopes, state, prompt: "select_account" });
}

export async function verifyGoogleLogin(code: string) {
  const client = loginOauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error("Google did not return an ID token");
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID! });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) throw new Error("Google account email is not verified");
  return payload.email;
}
