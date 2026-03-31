import { ENV } from "../_core/env";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export const GOOGLE_ADS_API_VERSION = "v17";
const ADS_REST = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export function googleAdsOAuthRedirectUri(): string {
  if (ENV.googleOAuthRedirectUri) return ENV.googleOAuthRedirectUri;
  return `${ENV.publicAppUrl}/api/oauth/google/callback`;
}

export function buildGoogleAdsAuthorizeUrl(state: string): string {
  const cid = ENV.googleAdsClientId;
  if (!cid) throw new Error("GOOGLE_ADS_CLIENT_ID is not configured");
  const u = new URL(GOOGLE_AUTH);
  u.searchParams.set("client_id", cid);
  u.searchParams.set("redirect_uri", googleAdsOAuthRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", ADS_SCOPE);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    code,
    client_id: ENV.googleAdsClientId,
    client_secret: ENV.googleAdsClientSecret,
    redirect_uri: googleAdsOAuthRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token exchange failed: ${t}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function googleRefreshAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: ENV.googleAdsClientId,
    client_secret: ENV.googleAdsClientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google access token refresh failed: ${t}`);
  }
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

/** Accessible Google Ads customer IDs (numeric, no dashes). */
export async function listGoogleAdsCustomerIds(accessToken: string): Promise<string[]> {
  const dev = ENV.googleAdsDeveloperToken;
  if (!dev) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is required");

  const res = await fetch(`${ADS_REST}/customers:listAccessibleCustomers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": dev,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to fetch accessible customers: ${t}`);
  }
  const j = (await res.json()) as { resourceNames?: string[] };
  const names = j.resourceNames ?? [];
  const ids: string[] = [];
  for (const n of names) {
    const m = /^customers\/(\d+)$/.exec(n);
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

export async function googleMutateCampaignStatus(input: {
  customerId: string;
  accessToken: string;
  campaignId: string;
  status: "PAUSED" | "ENABLED";
}): Promise<void> {
  const dev = ENV.googleAdsDeveloperToken;
  if (!dev) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is required");

  const cid = input.customerId.replace(/\D/g, "");
  const campId = input.campaignId.replace(/\D/g, "");
  if (!cid || !campId) throw new Error("Invalid customer or campaign ID");

  const resourceName = `customers/${cid}/campaigns/${campId}`;
  const body = {
    operations: [
      {
        update: {
          resourceName,
          status: input.status,
        },
        updateMask: "status",
      },
    ],
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.accessToken}`,
    "developer-token": dev,
    "Content-Type": "application/json",
  };
  const login = ENV.googleAdsLoginCustomerId.replace(/\D/g, "");
  if (login) headers["login-customer-id"] = login;

  const res = await fetch(`${ADS_REST}/customers/${cid}/campaigns:mutate`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to update campaign status: ${t}`);
  }
}
