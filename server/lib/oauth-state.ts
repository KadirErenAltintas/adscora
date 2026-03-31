import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

const GOOGLE_TYP = "adscore_google_ads_oauth";
const META_TYP = "adscore_meta_ads_oauth";

function secretKey(): Uint8Array {
  const s = ENV.oauthStateSecret;
  if (!s) {
    throw new Error(
      "OAuth state imzası için ADSCORE_OAUTH_STATE_SECRET (veya eski ADSCORA/ADASTRA değişkenleri) veya SUPABASE_JWT_SECRET tanımlayın."
    );
  }
  return new TextEncoder().encode(s);
}

export async function signGoogleAdsOAuthState(input: {
  userId: number;
  storeId: number | null;
}): Promise<string> {
  return new SignJWT({
    typ: GOOGLE_TYP,
    uid: input.userId,
    sid: input.storeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey());
}

export async function verifyGoogleAdsOAuthState(
  token: string
): Promise<{ userId: number; storeId: number | null }> {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (payload.typ !== GOOGLE_TYP) {
    throw new Error("Geçersiz OAuth state");
  }
  const uid = payload.uid;
  const sid = payload.sid;
  if (typeof uid !== "number" || !Number.isFinite(uid)) {
    throw new Error("OAuth state: kullanıcı yok");
  }
  return {
    userId: uid,
    storeId: sid === null || sid === undefined ? null : Number(sid),
  };
}

export async function signMetaAdsOAuthState(input: {
  userId: number;
  storeId: number | null;
}): Promise<string> {
  return new SignJWT({
    typ: META_TYP,
    uid: input.userId,
    sid: input.storeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey());
}

export async function verifyMetaAdsOAuthState(
  token: string
): Promise<{ userId: number; storeId: number | null }> {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (payload.typ !== META_TYP) {
    throw new Error("Geçersiz OAuth state");
  }
  const uid = payload.uid;
  const sid = payload.sid;
  if (typeof uid !== "number" || !Number.isFinite(uid)) {
    throw new Error("OAuth state: kullanıcı yok");
  }
  return {
    userId: uid,
    storeId: sid === null || sid === undefined ? null : Number(sid),
  };
}
