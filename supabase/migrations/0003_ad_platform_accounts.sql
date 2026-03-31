-- Bağlı reklam hesapları (Google / Meta / TikTok). Service role ile erişim; RLS açık.

CREATE TABLE IF NOT EXISTS "googleAdsAccounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "storeId" integer,
  "customerId" varchar(32) NOT NULL,
  "refreshToken" text,
  "connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastSyncedAt" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "metaAdsAccounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "storeId" integer,
  "adAccountId" varchar(64) NOT NULL,
  "accessToken" text NOT NULL,
  "connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastSyncedAt" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "tikTokAdsAccounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "storeId" integer,
  "advertiserId" varchar(64) NOT NULL,
  "accessToken" text NOT NULL,
  "connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastSyncedAt" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "googleAdsAccounts_userId_idx" ON "googleAdsAccounts" ("userId");
CREATE INDEX IF NOT EXISTS "googleAdsAccounts_storeId_idx" ON "googleAdsAccounts" ("storeId");
CREATE INDEX IF NOT EXISTS "metaAdsAccounts_userId_idx" ON "metaAdsAccounts" ("userId");
CREATE INDEX IF NOT EXISTS "metaAdsAccounts_storeId_idx" ON "metaAdsAccounts" ("storeId");
CREATE INDEX IF NOT EXISTS "tikTokAdsAccounts_userId_idx" ON "tikTokAdsAccounts" ("userId");
CREATE INDEX IF NOT EXISTS "tikTokAdsAccounts_storeId_idx" ON "tikTokAdsAccounts" ("storeId");

ALTER TABLE "public"."googleAdsAccounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."metaAdsAccounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tikTokAdsAccounts" ENABLE ROW LEVEL SECURITY;
