import type {
  InsertUser,
  User,
  Store,
  Chat,
  Message,
  Analysis,
  Profile,
  Subscription,
  InsertAiRequest,
  GoogleAdsAccount,
  MetaAdsAccount,
  TikTokAdsAccount,
  AdPlatformAction,
} from "../shared/database.types";
import { ENV } from "./_core/env";
import { getSupabaseAdmin, resetSupabaseAdmin } from "./_core/supabaseAdmin";

/** Eski pooler kodundan kalan isim: admin istemcisini sıfırlar. */
export async function disposePostgresPool(): Promise<void> {
  resetSupabaseAdmin();
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
}

function mapUser(r: Record<string, unknown>): User {
  return {
    id: r.id as number,
    openId: r.openId as string,
    name: (r.name as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    loginMethod: (r.loginMethod as string | null) ?? null,
    role: r.role as User["role"],
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
    lastSignedIn: toDate(r.lastSignedIn),
  };
}

function mapStore(r: Record<string, unknown>): Store {
  return {
    id: r.id as number,
    userId: r.userId as number,
    name: r.name as string,
    niche: (r.niche as string | null) ?? null,
    website: (r.website as string | null) ?? null,
    targetMarket: (r.targetMarket as string | null) ?? null,
    currency: (r.currency as string | null) ?? "USD",
    monthlyBudget: (r.monthlyBudget as string | null) ?? null,
    platformFocus: (r.platformFocus as string[] | null) ?? null,
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

function mapChat(r: Record<string, unknown>): Chat {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: r.storeId as number,
    title: (r.title as string | null) ?? null,
    status: (r.status as Chat["status"]) ?? "active",
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

function mapMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as number,
    chatId: r.chatId as number,
    role: r.role as Message["role"],
    content: r.content as string,
    tokenUsageInput: (r.tokenUsageInput as number | null) ?? null,
    tokenUsageOutput: (r.tokenUsageOutput as number | null) ?? null,
    model: (r.model as string | null) ?? null,
    createdAt: toDate(r.createdAt),
  };
}

function mapAnalysis(r: Record<string, unknown>): Analysis {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: r.storeId as number,
    campaignName: (r.campaignName as string | null) ?? null,
    platform: (r.platform as Analysis["platform"]) ?? null,
    objective: (r.objective as string | null) ?? null,
    impressions: (r.impressions as number | null) ?? null,
    clicks: (r.clicks as number | null) ?? null,
    spend: (r.spend as string | null) ?? null,
    conversions: (r.conversions as number | null) ?? null,
    revenue: (r.revenue as string | null) ?? null,
    ctr: (r.ctr as string | null) ?? null,
    cpc: (r.cpc as string | null) ?? null,
    cpa: (r.cpa as string | null) ?? null,
    roas: (r.roas as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    creativeImageUrl: (r.creativeImageUrl as string | null) ?? null,
    executiveSummary: (r.executiveSummary as string | null) ?? null,
    mainProblems: (r.mainProblems as unknown) ?? null,
    reasoning: (r.reasoning as string | null) ?? null,
    recommendedActions: (r.recommendedActions as unknown) ?? null,
    metricsBreakdown: (r.metricsBreakdown as unknown) ?? null,
    missingDataWarnings: (r.missingDataWarnings as unknown) ?? null,
    creativeAnalysis: (r.creativeAnalysis as unknown) ?? null,
    resultSummary: (r.resultSummary as string | null) ?? null,
    aiFeedback: (r.aiFeedback as string | null) ?? null,
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

function mapProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as number,
    userId: r.userId as number,
    fullName: (r.fullName as string | null) ?? null,
    avatarUrl: (r.avatarUrl as string | null) ?? null,
    onboardingCompleted: (r.onboardingCompleted as number) ?? 0,
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

function mapSubscription(r: Record<string, unknown>): Subscription {
  return {
    id: r.id as number,
    userId: r.userId as number,
    plan: r.plan as Subscription["plan"],
    status: r.status as Subscription["status"],
    stripeCustomerId: (r.stripeCustomerId as string | null) ?? null,
    stripeSubscriptionId: (r.stripeSubscriptionId as string | null) ?? null,
    currentPeriodEnd: r.currentPeriodEnd ? toDate(r.currentPeriodEnd) : null,
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    console.warn("[Database] Supabase admin yok (SUPABASE_SERVICE_ROLE_KEY + URL). upsert atlandı.");
    return;
  }

  const values: Record<string, unknown> = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
      const value = user[field];
    if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
  }

    if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn.toISOString();
    updateSet.lastSignedIn = user.lastSignedIn.toISOString();
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
    values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date().toISOString();
  }

  const { data: existing, error: selErr } = await sb
    .from("users")
    .select("id")
    .eq("openId", user.openId)
    .maybeSingle();

  if (selErr) {
    console.error("[Database] upsert user select:", selErr.message);
    throw selErr;
  }

  try {
    if (existing) {
      const { error } = await sb.from("users").update(updateSet).eq("openId", user.openId);
      if (error) throw error;
    } else {
      const { error } = await sb.from("users").insert(values);
      if (error) throw error;
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    console.warn("[Database] Supabase admin yok; kullanıcı okunamıyor.");
    return undefined;
  }

  const { data, error } = await sb.from("users").select("*").eq("openId", openId).maybeSingle();

  if (error) {
    console.error("[Database] getUserByOpenId:", error.message);
    return undefined;
  }
  if (!data) return undefined;
  return mapUser(data as Record<string, unknown>);
}

export async function getUserById(id: number): Promise<User | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb.from("users").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return mapUser(data as Record<string, unknown>);
}

export async function getUserStores(userId: number): Promise<Store[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("stores")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[Database] getUserStores:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapStore(r as Record<string, unknown>));
}

export async function getStoreById(storeId: number, userId: number): Promise<Store | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapStore(data as Record<string, unknown>);
}

export async function getUserChats(userId: number): Promise<Chat[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("userId", userId)
    .order("id", { ascending: false });

  if (error) {
    console.error("[Database] getUserChats:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapChat(r as Record<string, unknown>));
}

/** En az bir mesajı olan sohbetler (boş taslaklar listede görünmez). */
export async function getUserChatsWithMessages(userId: number): Promise<Chat[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("chats")
    .select("*, messages!inner(id)")
    .eq("userId", userId)
    .order("id", { ascending: false });

  if (!error && data) {
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const { messages: _m, ...rest } = row;
      return mapChat(rest as Record<string, unknown>);
    });
  }

  if (error) {
    console.warn("[Database] getUserChatsWithMessages inner join failed, fallback:", error.message);
  }

  const { data: msgRows, error: msgErr } = await sb.from("messages").select("chatId");
  if (msgErr || !msgRows?.length) return [];
  const ids = Array.from(
    new Set(
      (msgRows as { chatId: number }[])
        .map((r) => r.chatId)
        .filter((id): id is number => typeof id === "number")
    )
  );
  if (ids.length === 0) return [];

  const { data: chats, error: chErr } = await sb
    .from("chats")
    .select("*")
    .eq("userId", userId)
    .in("id", ids)
    .order("id", { ascending: false });

  if (chErr) {
    console.error("[Database] getUserChatsWithMessages fallback:", chErr.message);
    return [];
  }
  return (chats ?? []).map((r) => mapChat(r as Record<string, unknown>));
}

export async function getChatById(chatId: number, userId: number): Promise<Chat | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapChat(data as Record<string, unknown>);
}

/** Mesajları ve sohbeti siler; yalnızca sahibi silebilir. */
export async function deleteChatForUser(chatId: number, userId: number): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");
  const chat = await getChatById(chatId, userId);
  if (!chat) return false;
  const { error: delMsg } = await sb.from("messages").delete().eq("chatId", chatId);
  if (delMsg) throw delMsg;
  const { error: delChat } = await sb.from("chats").delete().eq("id", chatId).eq("userId", userId);
  if (delChat) throw delChat;
  return true;
}

export async function getChatMessages(chatId: number): Promise<Message[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("chatId", chatId)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("[Database] getChatMessages:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapMessage(r as Record<string, unknown>));
}

export async function getUserAnalyses(userId: number): Promise<Analysis[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("analyses")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[Database] getUserAnalyses:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapAnalysis(r as Record<string, unknown>));
}

export async function getAnalysisById(
  analysisId: number,
  userId: number
): Promise<Analysis | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapAnalysis(data as Record<string, unknown>);
}

export async function getOrCreateProfile(userId: number): Promise<Profile | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data: first, error: e1 } = await sb
    .from("profiles")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();

  if (e1) {
    console.error("[Database] getOrCreateProfile:", e1.message);
    return undefined;
  }

  if (first) return mapProfile(first as Record<string, unknown>);

  const { error: insErr } = await sb.from("profiles").insert({ userId, onboardingCompleted: 0 });
  if (insErr && !/duplicate key/i.test(insErr.message)) {
    console.error("[Database] profile insert:", insErr.message);
    return undefined;
  }

  const { data: second, error: e2 } = await sb
    .from("profiles")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();

  if (e2 || !second) return undefined;
  return mapProfile(second as Record<string, unknown>);
}

export async function logAiRequest(data: InsertAiRequest): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const row: Record<string, unknown> = {
    userId: data.userId,
    storeId: data.storeId ?? null,
    feature: data.feature,
    model: data.model ?? null,
    status: data.status,
    inputTokens: data.inputTokens ?? null,
    outputTokens: data.outputTokens ?? null,
    latencyMs: data.latencyMs ?? null,
    errorMessage: data.errorMessage ?? null,
  };

  const { error } = await sb.from("aiRequests").insert(row);
  if (error) {
    console.error("[Database] logAiRequest:", error.message);
  }
}

export async function getUserSubscription(userId: number): Promise<Subscription | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("subscriptions")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapSubscription(data as Record<string, unknown>);
}

export async function createStoreRecord(
  userId: number,
  input: {
    name: string;
    niche?: string | null;
    website?: string | null;
    targetMarket?: string | null;
    currency: string;
    monthlyBudget: number | null;
    platformFocus: string[] | null;
  }
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { error } = await sb.from("stores").insert({
    userId,
    name: input.name,
    niche: input.niche ?? null,
    website: input.website ?? null,
    targetMarket: input.targetMarket ?? null,
    currency: input.currency,
    monthlyBudget: input.monthlyBudget != null ? String(input.monthlyBudget) : null,
    platformFocus: input.platformFocus,
  });

  if (error) throw error;
}

export async function createStoreRecordReturningId(
  userId: number,
  input: {
    name: string;
    niche?: string | null;
    website?: string | null;
    targetMarket?: string | null;
    currency: string;
    monthlyBudget: number | null;
    platformFocus: string[] | null;
  }
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("stores")
    .insert({
      userId,
      name: input.name,
      niche: input.niche ?? null,
      website: input.website ?? null,
      targetMarket: input.targetMarket ?? null,
      currency: input.currency,
      monthlyBudget: input.monthlyBudget != null ? String(input.monthlyBudget) : null,
      platformFocus: input.platformFocus,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function createChatRecord(
  userId: number,
  storeId: number,
  title: string | null
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { error } = await sb.from("chats").insert({
    userId,
    storeId,
    title: title ?? "Sohbet",
  });

  if (error) throw error;
}

function mapGoogleAdsAccount(r: Record<string, unknown>): GoogleAdsAccount {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: (r.storeId as number | null) ?? null,
    customerId: r.customerId as string,
    refreshToken: (r.refreshToken as string | null) ?? null,
    connectedAt: toDate(r.connectedAt),
    lastSyncedAt: r.lastSyncedAt ? toDate(r.lastSyncedAt) : null,
  };
}

function mapMetaAdsAccount(r: Record<string, unknown>): MetaAdsAccount {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: (r.storeId as number | null) ?? null,
    adAccountId: r.adAccountId as string,
    accessToken: r.accessToken as string,
    connectedAt: toDate(r.connectedAt),
    lastSyncedAt: r.lastSyncedAt ? toDate(r.lastSyncedAt) : null,
  };
}

function mapTikTokAdsAccount(r: Record<string, unknown>): TikTokAdsAccount {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: (r.storeId as number | null) ?? null,
    advertiserId: r.advertiserId as string,
    accessToken: r.accessToken as string,
    connectedAt: toDate(r.connectedAt),
    lastSyncedAt: r.lastSyncedAt ? toDate(r.lastSyncedAt) : null,
  };
}

export async function createChatRecordReturningId(
  userId: number,
  storeId: number,
  title: string | null
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("chats")
    .insert({
      userId,
      storeId,
      title: title ?? "Sohbet",
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function insertMessageRow(row: {
  chatId: number;
  role: Message["role"];
  content: string;
  tokenUsageInput?: number | null;
  tokenUsageOutput?: number | null;
  model?: string | null;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("messages")
    .insert({
      chatId: row.chatId,
      role: row.role,
      content: row.content,
      tokenUsageInput: row.tokenUsageInput ?? null,
      tokenUsageOutput: row.tokenUsageOutput ?? null,
      model: row.model ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export const ADSCORA_CONSULTANT_CHAT_TITLE = "Adscora AI Danışman";
/** Eski kurulumlar: aynı sohbet kaydını bulmak için */
const LEGACY_CONSULTANT_CHAT_TITLE = "Adastra AI Danışman";

export async function getOrCreateConsultantChatId(userId: number, storeId: number): Promise<number> {
  let found = await findConsultantChatByTitle(userId, storeId, ADSCORA_CONSULTANT_CHAT_TITLE);
  if (found) return found.id;
  found = await findConsultantChatByTitle(userId, storeId, LEGACY_CONSULTANT_CHAT_TITLE);
  if (found) return found.id;
  return createChatRecordReturningId(userId, storeId, ADSCORA_CONSULTANT_CHAT_TITLE);
}

export async function findConsultantChatByTitle(
  userId: number,
  storeId: number,
  title: string
): Promise<Chat | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("userId", userId)
    .eq("storeId", storeId)
    .eq("title", title)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapChat(data as Record<string, unknown>);
}

export async function setProfileOnboardingCompleted(
  userId: number,
  completed: number
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  await sb.from("profiles").update({ onboardingCompleted: completed }).eq("userId", userId);
}

export async function insertGoogleAdsAccountRow(input: {
  userId: number;
  storeId: number | null;
  customerId: string;
  refreshToken: string | null;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("googleAdsAccounts")
    .insert({
      userId: input.userId,
      storeId: input.storeId,
      customerId: input.customerId.replace(/-/g, ""),
      refreshToken: input.refreshToken,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

/** Aynı müşteri için yenileme token’ını günceller veya yeni satır ekler. */
export async function upsertGoogleAdsAccountRow(input: {
  userId: number;
  storeId: number | null;
  customerId: string;
  refreshToken: string | null;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const cid = input.customerId.replace(/-/g, "");
  const { data: existing } = await sb
    .from("googleAdsAccounts")
    .select("id")
    .eq("userId", input.userId)
    .eq("customerId", cid)
    .maybeSingle();

  if (existing && typeof (existing as { id: number }).id === "number") {
    const id = (existing as { id: number }).id;
    await sb
      .from("googleAdsAccounts")
      .update({
        refreshToken: input.refreshToken,
        ...(input.storeId != null ? { storeId: input.storeId } : {}),
      })
      .eq("id", id);
    return id;
  }

  return insertGoogleAdsAccountRow({
    userId: input.userId,
    storeId: input.storeId,
    customerId: cid,
    refreshToken: input.refreshToken,
  });
}

/** Meta: aynı reklam hesabı için token güncelle veya ekle. */
export async function upsertMetaAdsAccountRow(input: {
  userId: number;
  storeId: number | null;
  adAccountId: string;
  accessToken: string;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const act = input.adAccountId.startsWith("act_") ? input.adAccountId : `act_${input.adAccountId}`;
  const { data: existing } = await sb
    .from("metaAdsAccounts")
    .select("id")
    .eq("userId", input.userId)
    .eq("adAccountId", act)
    .maybeSingle();

  if (existing && typeof (existing as { id: number }).id === "number") {
    const id = (existing as { id: number }).id;
    await sb
      .from("metaAdsAccounts")
      .update({
        accessToken: input.accessToken,
        ...(input.storeId != null ? { storeId: input.storeId } : {}),
      })
      .eq("id", id);
    return id;
  }

  return insertMetaAdsAccountRow({
    userId: input.userId,
    storeId: input.storeId,
    adAccountId: act,
    accessToken: input.accessToken,
  });
}

export async function getGoogleAdsAccountForUser(
  accountId: number,
  userId: number
): Promise<GoogleAdsAccount | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("googleAdsAccounts")
    .select("*")
    .eq("id", accountId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapGoogleAdsAccount(data as Record<string, unknown>);
}

export async function listGoogleAdsAccountsForUser(
  userId: number,
  storeId?: number
): Promise<GoogleAdsAccount[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  let q = sb.from("googleAdsAccounts").select("*").eq("userId", userId);
  if (storeId != null) q = q.eq("storeId", storeId);
  const { data, error } = await q.order("connectedAt", { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => mapGoogleAdsAccount(r as Record<string, unknown>));
}

export async function insertMetaAdsAccountRow(input: {
  userId: number;
  storeId: number | null;
  adAccountId: string;
  accessToken: string;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("metaAdsAccounts")
    .insert({
      userId: input.userId,
      storeId: input.storeId,
      adAccountId: input.adAccountId.startsWith("act_") ? input.adAccountId : `act_${input.adAccountId}`,
      accessToken: input.accessToken,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function getMetaAdsAccountForUser(
  accountId: number,
  userId: number
): Promise<MetaAdsAccount | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("metaAdsAccounts")
    .select("*")
    .eq("id", accountId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapMetaAdsAccount(data as Record<string, unknown>);
}

export async function listMetaAdsAccountsForUser(
  userId: number,
  storeId?: number
): Promise<MetaAdsAccount[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  let q = sb.from("metaAdsAccounts").select("*").eq("userId", userId);
  if (storeId != null) q = q.eq("storeId", storeId);
  const { data, error } = await q.order("connectedAt", { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => mapMetaAdsAccount(r as Record<string, unknown>));
}

export async function insertTikTokAdsAccountRow(input: {
  userId: number;
  storeId: number | null;
  advertiserId: string;
  accessToken: string;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("tikTokAdsAccounts")
    .insert({
      userId: input.userId,
      storeId: input.storeId,
      advertiserId: input.advertiserId,
      accessToken: input.accessToken,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function getTikTokAdsAccountForUser(
  accountId: number,
  userId: number
): Promise<TikTokAdsAccount | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("tikTokAdsAccounts")
    .select("*")
    .eq("id", accountId)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapTikTokAdsAccount(data as Record<string, unknown>);
}

export async function listTikTokAdsAccountsForUser(
  userId: number,
  storeId?: number
): Promise<TikTokAdsAccount[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  let q = sb.from("tikTokAdsAccounts").select("*").eq("userId", userId);
  if (storeId != null) q = q.eq("storeId", storeId);
  const { data, error } = await q.order("connectedAt", { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => mapTikTokAdsAccount(r as Record<string, unknown>));
}

export async function listAllStores(): Promise<Store[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb.from("stores").select("*").order("id", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => mapStore(r as Record<string, unknown>));
}

const AD_PLATFORMS = new Set(["meta", "google", "tiktok", "other"]);

export async function insertAiGeneratedAnalysisRow(row: {
  userId: number;
  storeId: number;
  campaignName?: string | null;
  platform?: Analysis["platform"] | string | null;
  objective?: string | null;
  impressions?: number | null;
  clicks?: number | null;
  spend?: string | null;
  conversions?: number | null;
  revenue?: string | null;
  ctr?: string | null;
  cpc?: string | null;
  cpa?: string | null;
  roas?: string | null;
  notes?: string | null;
  creativeImageUrl?: string | null;
  executiveSummary: string;
  mainProblems?: unknown;
  reasoning?: string | null;
  recommendedActions?: unknown;
  metricsBreakdown?: unknown;
  missingDataWarnings?: unknown;
  creativeAnalysis?: unknown;
  resultSummary?: string | null;
  aiFeedback?: string | null;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const p = row.platform && AD_PLATFORMS.has(String(row.platform)) ? row.platform : "other";

  const { data, error } = await sb
    .from("analyses")
    .insert({
      userId: row.userId,
      storeId: row.storeId,
      campaignName: row.campaignName ?? "AI raporu",
      platform: p,
      objective: row.objective ?? null,
      impressions: row.impressions ?? null,
      clicks: row.clicks ?? null,
      spend: row.spend ?? null,
      conversions: row.conversions ?? null,
      revenue: row.revenue ?? null,
      ctr: row.ctr ?? null,
      cpc: row.cpc ?? null,
      cpa: row.cpa ?? null,
      roas: row.roas ?? null,
      notes: row.notes ?? null,
      creativeImageUrl: row.creativeImageUrl?.slice(0, 2000) ?? null,
      executiveSummary: row.executiveSummary,
      mainProblems: row.mainProblems ?? [],
      reasoning: row.reasoning ?? null,
      recommendedActions: row.recommendedActions ?? [],
      metricsBreakdown: row.metricsBreakdown ?? {},
      missingDataWarnings: row.missingDataWarnings ?? [],
      creativeAnalysis: row.creativeAnalysis ?? null,
      resultSummary: row.resultSummary ?? null,
      aiFeedback: row.aiFeedback ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function insertAnalysisFromService(row: {
  userId: number;
  storeId: number;
  campaignName?: string | null;
  platform?: string | null;
  objective?: string | null;
  impressions?: number | null;
  clicks?: number | null;
  spend?: string | null;
  conversions?: number | null;
  revenue?: string | null;
  ctr?: string | null;
  cpc?: string | null;
  cpa?: string | null;
  roas?: string | null;
  resultSummary?: string | null;
  aiFeedback?: string | null;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("analyses").insert(row);
  if (error) {
    console.error("[Database] insertAnalysisFromService:", error.message);
  }
}

export async function insertAutoPlatformAnalysis(row: {
  userId: number;
  storeId: number;
  platform: Analysis["platform"];
  metricsBreakdown: unknown;
  executiveSummary: string;
  mainProblems: unknown;
  recommendedActions: unknown;
  resultSummary?: string | null;
  reasoning?: string | null;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("analyses").insert({
    userId: row.userId,
    storeId: row.storeId,
    platform: row.platform,
    campaignName: "Otomatik platform özeti",
    metricsBreakdown: row.metricsBreakdown,
    executiveSummary: row.executiveSummary,
    mainProblems: row.mainProblems,
    recommendedActions: row.recommendedActions,
    resultSummary: row.resultSummary ?? null,
    reasoning: row.reasoning ?? null,
  });
  if (error) {
    console.error("[Database] insertAutoPlatformAnalysis:", error.message);
  }
}

function mapAdPlatformAction(r: Record<string, unknown>): AdPlatformAction {
  return {
    id: r.id as number,
    userId: r.userId as number,
    storeId: (r.storeId as number | null) ?? null,
    platform: r.platform as string,
    googleAdsAccountId: (r.googleAdsAccountId as number | null) ?? null,
    metaAdsAccountId: (r.metaAdsAccountId as number | null) ?? null,
    status: r.status as AdPlatformAction["status"],
    actionType: r.actionType as string,
    summaryTr: r.summaryTr as string,
    detailTr: (r.detailTr as string | null) ?? null,
    payloadBefore: r.payloadBefore ?? null,
    payloadAfter: r.payloadAfter ?? null,
    revertPayload: r.revertPayload ?? null,
    externalResource: (r.externalResource as string | null) ?? null,
    errorMessage: (r.errorMessage as string | null) ?? null,
    createdAt: toDate(r.createdAt),
    appliedAt: r.appliedAt ? toDate(r.appliedAt) : null,
    revertedAt: r.revertedAt ? toDate(r.revertedAt) : null,
  };
}

export async function insertAdPlatformActionRow(input: {
  userId: number;
  storeId: number | null;
  platform: string;
  googleAdsAccountId?: number | null;
  metaAdsAccountId?: number | null;
  status: AdPlatformAction["status"];
  actionType: string;
  summaryTr: string;
  detailTr?: string | null;
  payloadBefore?: unknown;
  payloadAfter?: unknown;
  revertPayload?: unknown;
  externalResource?: string | null;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Database not available");

  const { data, error } = await sb
    .from("adPlatformActions")
    .insert({
      userId: input.userId,
      storeId: input.storeId,
      platform: input.platform,
      googleAdsAccountId: input.googleAdsAccountId ?? null,
      metaAdsAccountId: input.metaAdsAccountId ?? null,
      status: input.status,
      actionType: input.actionType,
      summaryTr: input.summaryTr,
      detailTr: input.detailTr ?? null,
      payloadBefore: input.payloadBefore ?? null,
      payloadAfter: input.payloadAfter ?? null,
      revertPayload: input.revertPayload ?? null,
      externalResource: input.externalResource ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

export async function getAdPlatformActionByIdForUser(
  id: number,
  userId: number
): Promise<AdPlatformAction | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("adPlatformActions")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapAdPlatformAction(data as Record<string, unknown>);
}

export async function listAdPlatformActionsForUser(
  userId: number,
  opts?: { storeId?: number; limit?: number }
): Promise<AdPlatformAction[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  let q = sb.from("adPlatformActions").select("*").eq("userId", userId);
  if (opts?.storeId != null) q = q.eq("storeId", opts.storeId);
  const { data, error } = await q
    .order("createdAt", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (error) return [];
  return (data ?? []).map((r) => mapAdPlatformAction(r as Record<string, unknown>));
}

export async function updateAdPlatformActionRow(
  id: number,
  userId: number,
  patch: Partial<{
    status: AdPlatformAction["status"];
    payloadAfter: unknown;
    errorMessage: string | null;
    appliedAt: Date | null;
    revertedAt: Date | null;
  }>
): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const { data, error } = await sb
    .from("adPlatformActions")
    .update(patch)
    .eq("id", id)
    .eq("userId", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) return false;
  return true;
}
