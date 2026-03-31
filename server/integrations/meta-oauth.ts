import { ENV } from "../_core/env";

const VERSION = "v21.0";

export function metaOAuthRedirectUri(): string {
  if (ENV.metaOAuthRedirectUri) return ENV.metaOAuthRedirectUri;
  return `${ENV.publicAppUrl}/api/oauth/meta/callback`;
}

export function buildMetaAdsAuthorizeUrl(state: string): string {
  const clientId = ENV.metaAppId;
  if (!clientId) throw new Error("META_APP_ID is not configured");
  const u = new URL(`https://www.facebook.com/${VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", metaOAuthRedirectUri());
  u.searchParams.set("state", state);
  u.searchParams.set("scope", ["ads_read", "ads_management"].join(","));
  return u.toString();
}

export async function exchangeMetaAuthorizationCode(code: string): Promise<{ access_token: string }> {
  const secret = ENV.metaAppSecret;
  if (!secret) throw new Error("META_APP_SECRET is not configured");

  const u = new URL(`https://graph.facebook.com/${VERSION}/oauth/access_token`);
  u.searchParams.set("client_id", ENV.metaAppId);
  u.searchParams.set("client_secret", secret);
  u.searchParams.set("redirect_uri", metaOAuthRedirectUri());
  u.searchParams.set("code", code);

  const res = await fetch(u.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta token exchange failed: ${t}`);
  }
  return res.json() as Promise<{ access_token: string }>;
}

export async function metaLongLivedUserToken(shortLivedToken: string): Promise<string> {
  const secret = ENV.metaAppSecret;
  if (!secret) throw new Error("META_APP_SECRET is not configured");

  const u = new URL(`https://graph.facebook.com/${VERSION}/oauth/access_token`);
  u.searchParams.set("grant_type", "fb_exchange_token");
  u.searchParams.set("client_id", ENV.metaAppId);
  u.searchParams.set("client_secret", secret);
  u.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(u.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to exchange long-lived Meta token: ${t}`);
  }
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

export async function listMetaAdAccounts(accessToken: string): Promise<Array<{ id: string; name?: string }>> {
  const u = new URL(`https://graph.facebook.com/${VERSION}/me/adaccounts`);
  u.searchParams.set("fields", "id,name,account_id");
  u.searchParams.set("access_token", accessToken);
  const res = await fetch(u.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to fetch Meta ad accounts: ${t}`);
  }
  const j = (await res.json()) as { data?: Array<{ id: string; name?: string }> };
  return j.data ?? [];
}
