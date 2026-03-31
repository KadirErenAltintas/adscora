import { createRemoteJWKSet, jwtVerify, type JWTVerifyOptions } from "jose";
import type { Request } from "express";
import type { User } from "../../shared/database.types";
import * as db from "../db";
import { ENV } from "./env";

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length > 0 ? t : null;
}

function displayNameFromPayload(payload: Record<string, unknown>): string | null {
  const meta = payload.user_metadata;
  if (meta && typeof meta === "object" && meta !== null) {
    const m = meta as Record<string, unknown>;
    const full = m.full_name ?? m.name;
    if (typeof full === "string" && full.trim()) return full.trim();
  }
  return null;
}

const jwksByBaseUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getSupabaseJwks(baseUrl: string) {
  let jwks = jwksByBaseUrl.get(baseUrl);
  if (!jwks) {
    const jwksUrl = new URL(`${baseUrl}/auth/v1/.well-known/jwks.json`);
    jwks = createRemoteJWKSet(jwksUrl);
    jwksByBaseUrl.set(baseUrl, jwks);
  }
  return jwks;
}

/**
 * Supabase access_token doğrulama:
 * 1) ECC / rotasyonlu anahtarlar → JWKS (CURRENT KEY; Key ID yapıştırmaya gerek yok)
 * 2) Legacy → HS256 + SUPABASE_JWT_SECRET (PREVIOUS / eski paylaşımlı secret)
 */
async function verifySupabaseAccessToken(
  token: string
): Promise<Record<string, unknown> | null> {
  const baseUrl = ENV.supabaseUrl;

  if (baseUrl) {
    const issuerBase = `${baseUrl}/auth/v1`;
    const JWKS = getSupabaseJwks(baseUrl);
    // Issuer/aud farklı sürümlerde değişebilir; son seçenekte sadece imza+JWKS (proje URL’sine özgü anahtarlar).
    const optionSets: JWTVerifyOptions[] = [
      { issuer: issuerBase, audience: "authenticated" },
      { issuer: issuerBase },
      { issuer: `${issuerBase}/` },
      { issuer: issuerBase, audience: ["authenticated"] },
      { issuer: issuerBase, clockTolerance: 60 },
      {},
    ];
    let lastJwksError: unknown;
    for (const opts of optionSets) {
      try {
        const { payload } = await jwtVerify(token, JWKS, opts);
        return payload as Record<string, unknown>;
      } catch (e) {
        lastJwksError = e;
      }
    }
    if (!ENV.isProduction && lastJwksError) {
      console.warn(
        "[Auth] JWKS son hata:",
        lastJwksError instanceof Error ? lastJwksError.message : lastJwksError
      );
    }
  }

  const secret = ENV.supabaseJwtSecret;
  if (secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
        algorithms: ["HS256"],
      });
      return payload as Record<string, unknown>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!baseUrl) {
        console.warn("[Auth] HS256 JWT doğrulama başarısız:", msg);
      }
    }
  }

  if (!baseUrl && !secret) {
    console.warn(
      "[Auth] Supabase proje URL’i veya SUPABASE_JWT_SECRET tanımlı değil — token doğrulanamaz."
    );
  } else if (baseUrl) {
    console.warn(
      "[Auth] JWKS + (varsa) HS256 ile token doğrulanamadı. SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL proje köküyle aynı mı? Sunucuyu yeniden başlatın."
    );
  }
  return null;
}

/**
 * Resolves the signed-in user from Supabase access_token (Authorization: Bearer).
 * Stores Supabase `sub` in users.openId for compatibility with existing schema.
 */
export async function authenticateSupabaseRequest(
  req: Request
): Promise<User | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const p = await verifySupabaseAccessToken(token);
  if (!p) {
    return null;
  }

  const sub = p.sub;
  if (typeof sub !== "string" || !sub) {
    console.warn("[Auth] JWT içinde sub yok.");
    return null;
  }

  const email = typeof p.email === "string" ? p.email : null;
  const name = displayNameFromPayload(p);
  const signedInAt = new Date();

  try {
    await db.upsertUser({
      openId: sub,
      email: email ?? undefined,
      name: name ?? undefined,
      loginMethod: "supabase",
      lastSignedIn: signedInAt,
    });

    const user = await db.getUserByOpenId(sub);
    if (!user) {
      console.warn("[Auth] upsert sonrası kullanıcı okunamadı (openId:", sub, ")");
    }
    return user ?? null;
  } catch (err) {
    console.error(
      "[Auth] JWT geçti ama veritabanına kullanıcı yazılamadı (şema/migration/izin). auth.me boş döner:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
