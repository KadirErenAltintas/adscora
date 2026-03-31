-- AI / kullanıcı onaylı reklam değişiklikleri + geri alma günlüğü

CREATE TABLE IF NOT EXISTS "adPlatformActions" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "storeId" integer,
  "platform" varchar(32) NOT NULL,
  "googleAdsAccountId" integer,
  "metaAdsAccountId" integer,
  "status" varchar(32) NOT NULL DEFAULT 'pending_approval',
  "actionType" varchar(64) NOT NULL,
  "summaryTr" text NOT NULL,
  "detailTr" text,
  "payloadBefore" jsonb,
  "payloadAfter" jsonb,
  "revertPayload" jsonb,
  "externalResource" text,
  "errorMessage" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "appliedAt" timestamp with time zone,
  "revertedAt" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "adPlatformActions_userId_idx" ON "adPlatformActions" ("userId");
CREATE INDEX IF NOT EXISTS "adPlatformActions_storeId_idx" ON "adPlatformActions" ("storeId");
CREATE INDEX IF NOT EXISTS "adPlatformActions_status_idx" ON "adPlatformActions" ("status");

ALTER TABLE "public"."adPlatformActions" ENABLE ROW LEVEL SECURITY;
