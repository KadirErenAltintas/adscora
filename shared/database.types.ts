/** Postgres / PostgREST şeması ile uyumlu uygulama tipleri (Supabase). */

export type UserRole = "user" | "admin";
export type AiFeature = "chat" | "analysis";
export type AiRequestStatus = "success" | "error";
export type AdPlatform = "meta" | "google" | "tiktok" | "other";
export type ChatStatus = "active" | "archived";
export type MessageRole = "system" | "user" | "assistant";
export type SubscriptionPlan = "free" | "pro" | "team";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: UserRole;
  lastSignedIn?: Date;
};

export type Profile = {
  id: number;
  userId: number;
  fullName: string | null;
  avatarUrl: string | null;
  onboardingCompleted: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Store = {
  id: number;
  userId: number;
  name: string;
  niche: string | null;
  website: string | null;
  targetMarket: string | null;
  currency: string | null;
  monthlyBudget: string | null;
  platformFocus: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Chat = {
  id: number;
  userId: number;
  storeId: number;
  title: string | null;
  status: ChatStatus | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: number;
  chatId: number;
  role: MessageRole;
  content: string;
  tokenUsageInput: number | null;
  tokenUsageOutput: number | null;
  model: string | null;
  createdAt: Date;
};

export type Analysis = {
  id: number;
  userId: number;
  storeId: number;
  campaignName: string | null;
  platform: AdPlatform | null;
  objective: string | null;
  impressions: number | null;
  clicks: number | null;
  spend: string | null;
  conversions: number | null;
  revenue: string | null;
  ctr: string | null;
  cpc: string | null;
  cpa: string | null;
  roas: string | null;
  notes: string | null;
  creativeImageUrl: string | null;
  executiveSummary: string | null;
  mainProblems: unknown;
  reasoning: string | null;
  recommendedActions: unknown;
  metricsBreakdown: unknown;
  missingDataWarnings: unknown;
  creativeAnalysis: unknown;
  resultSummary: string | null;
  aiFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertAiRequest = {
  userId: number;
  storeId?: number | null;
  feature: AiFeature;
  model?: string | null;
  status: AiRequestStatus;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  errorMessage?: string | null;
};

export type Subscription = {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GoogleAdsAccount = {
  id: number;
  userId: number;
  storeId: number | null;
  customerId: string;
  refreshToken: string | null;
  connectedAt: Date;
  lastSyncedAt: Date | null;
};

export type MetaAdsAccount = {
  id: number;
  userId: number;
  storeId: number | null;
  adAccountId: string;
  accessToken: string;
  connectedAt: Date;
  lastSyncedAt: Date | null;
};

export type TikTokAdsAccount = {
  id: number;
  userId: number;
  storeId: number | null;
  advertiserId: string;
  accessToken: string;
  connectedAt: Date;
  lastSyncedAt: Date | null;
};

/** Reklam panelinde yapılan değişiklik kaydı (onay + geri alma). */
export type AdPlatformActionStatus =
  | "pending_approval"
  | "applied"
  | "failed"
  | "reverted";

export type AdPlatformAction = {
  id: number;
  userId: number;
  storeId: number | null;
  platform: string;
  googleAdsAccountId: number | null;
  metaAdsAccountId: number | null;
  status: AdPlatformActionStatus;
  actionType: string;
  summaryTr: string;
  detailTr: string | null;
  payloadBefore: unknown;
  payloadAfter: unknown;
  revertPayload: unknown;
  externalResource: string | null;
  errorMessage: string | null;
  createdAt: Date;
  appliedAt: Date | null;
  revertedAt: Date | null;
};
