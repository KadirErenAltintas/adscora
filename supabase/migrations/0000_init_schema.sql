-- İlk şema: `shared/database.types.ts` ile uyumlu.
-- Tekrar çalıştırılabilir: mevcut ENUM/tablolar atlanır (önce yarım kaldıysa kaldığınız yerden devam edebilirsiniz).

-- ENUM’lar (zaten varsa hata vermez)
DO $$ BEGIN CREATE TYPE "public"."ad_platform" AS ENUM('meta', 'google', 'tiktok', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."ai_feature" AS ENUM('chat', 'analysis'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."ai_request_status" AS ENUM('success', 'error'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."chat_status" AS ENUM('active', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."message_role" AS ENUM('system', 'user', 'assistant'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro', 'team'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "aiRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"storeId" integer,
	"feature" "ai_feature" NOT NULL,
	"model" varchar(100),
	"status" "ai_request_status" NOT NULL,
	"inputTokens" integer,
	"outputTokens" integer,
	"latencyMs" integer,
	"errorMessage" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"storeId" integer NOT NULL,
	"campaignName" varchar(255),
	"platform" "ad_platform",
	"objective" varchar(255),
	"impressions" integer,
	"clicks" integer,
	"spend" numeric(12, 2),
	"conversions" integer,
	"revenue" numeric(12, 2),
	"ctr" numeric(10, 4),
	"cpc" numeric(10, 4),
	"cpa" numeric(10, 4),
	"roas" numeric(10, 4),
	"notes" text,
	"creativeImageUrl" varchar(500),
	"executiveSummary" text,
	"mainProblems" jsonb,
	"reasoning" text,
	"recommendedActions" jsonb,
	"metricsBreakdown" jsonb,
	"missingDataWarnings" jsonb,
	"creativeAnalysis" jsonb,
	"resultSummary" text,
	"aiFeedback" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"storeId" integer NOT NULL,
	"title" varchar(255),
	"status" "chat_status" DEFAULT 'active',
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatId" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"tokenUsageInput" integer,
	"tokenUsageOutput" integer,
	"model" varchar(100),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fullName" text,
	"avatarUrl" varchar(500),
	"onboardingCompleted" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_userId_unique" UNIQUE("userId")
);

CREATE TABLE IF NOT EXISTS "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"niche" varchar(255),
	"website" varchar(500),
	"targetMarket" varchar(255),
	"currency" varchar(10) DEFAULT 'USD',
	"monthlyBudget" numeric(12, 2),
	"platformFocus" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"currentPeriodEnd" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
