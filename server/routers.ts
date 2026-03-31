import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getUserStores,
  getStoreById,
  getUserChats,
  getUserChatsWithMessages,
  getChatById,
  getChatMessages,
  getUserAnalyses,
  getAnalysisById,
  getOrCreateProfile,
  createStoreRecord,
  createChatRecordReturningId,
  deleteChatForUser,
  getOrCreateConsultantChatId,
  createStoreRecordReturningId,
  insertGoogleAdsAccountRow,
  getGoogleAdsAccountForUser,
  insertMetaAdsAccountRow,
  getMetaAdsAccountForUser,
  insertTikTokAdsAccountRow,
  getTikTokAdsAccountForUser,
  listGoogleAdsAccountsForUser,
  listMetaAdsAccountsForUser,
  listTikTokAdsAccountsForUser,
} from "./db";
import { getSupabaseAdmin } from "./_core/supabaseAdmin";
import { ENV } from "./_core/env";
import { googleAdsService } from "./integrations/google-ads";
import { MetaAdsService } from "./integrations/meta-ads";
import { TikTokAdsService } from "./integrations/tiktok-ads";
import { autoStoreCreationService } from "./services/store-creation";
import { autoAnalysisService } from "./services/auto-analysis";
import { scheduleSixHourJob } from "./services/analysis-scheduler";
import { signGoogleAdsOAuthState, signMetaAdsOAuthState } from "./lib/oauth-state";
import { buildGoogleAdsAuthorizeUrl } from "./integrations/google-ads-oauth";
import { buildMetaAdsAuthorizeUrl } from "./integrations/meta-oauth";
import { adPlatformActionsService } from "./services/ad-platform-actions";
import { createVisualReportFromPrompt } from "./services/ai-visual-report";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    /** Giriş sonrası sorun giderme: sunucu Supabase (service_role) ile tabloya erişebiliyor mu */
    dbHealth: publicProcedure.query(async () => {
      if (!ENV.supabaseUrl) {
        return {
          ok: false as const,
          code: "MISSING_SUPABASE_URL" as const,
          message:
            "SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL veya VITE_SUPABASE_URL boş. .env içine proje kök URL ekleyin.",
        };
      }
      if (!ENV.supabaseServiceRoleKey) {
        return {
          ok: false as const,
          code: "MISSING_SERVICE_ROLE" as const,
          message:
            "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Dashboard → Settings → API → service_role anahtarını kopyalayıp yalnızca sunucu .env’ine ekleyin (tarayıcıya / VITE_ ile koymayın).",
        };
      }

      const sb = getSupabaseAdmin();
      if (!sb) {
        return {
          ok: false as const,
          code: "SUPABASE_ADMIN_INIT" as const,
          message: "Supabase admin istemcisi oluşturulamadı. URL ve service role değerlerini kontrol edin.",
        };
      }

      const { error } = await sb.from("users").select("id").limit(1);
      if (error) {
        return {
          ok: false as const,
          code: "DB_REST_FAILED" as const,
          message:
            "Supabase REST hatası: `users` tablosuna erişilemiyor. `supabase/migrations/0000_init_schema.sql` uygulandı mı? `SUPABASE_SERVICE_ROLE_KEY` doğru mu?",
          detail: process.env.NODE_ENV === "development" ? error.message : undefined,
        };
      }

      return { ok: true as const };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Stores router
  stores: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserStores(ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getStoreById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      niche: z.string().optional(),
      website: z.string().optional(),
      targetMarket: z.string().optional(),
      currency: z.string().default("USD"),
      monthlyBudget: z.number().optional(),
      platformFocus: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const monthlyBudget = input.monthlyBudget ? parseFloat(input.monthlyBudget.toString()) : null;
      await createStoreRecord(ctx.user.id, {
        name: input.name,
        niche: input.niche || null,
        website: input.website || null,
        targetMarket: input.targetMarket || null,
        currency: input.currency,
        monthlyBudget,
        platformFocus: input.platformFocus || null,
      });
      return { success: true as const };
    }),
  }),

  // Chats router
  chats: router({
    list: protectedProcedure
      .input(
        z
          .object({
            onlyWithMessages: z.boolean().optional(),
          })
          .optional()
      )
      .query(({ ctx, input }) => {
        const only = input?.onlyWithMessages === true;
        return only ? getUserChatsWithMessages(ctx.user.id) : getUserChats(ctx.user.id);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getChatById(input.id, ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          storeId: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId, ctx.user.id);
        if (!store) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı" });
        }
        const id = await createChatRecordReturningId(
          ctx.user.id,
          input.storeId,
          input.title?.trim() || "Yeni sohbet"
        );
        return { id };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ok = await deleteChatForUser(input.id, ctx.user.id);
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sohbet bulunamadı" });
      }
      return { success: true as const };
    }),
  }),

  // Messages router
  messages: router({
    list: protectedProcedure.input(z.object({ chatId: z.number() })).query(({ input }) =>
      getChatMessages(input.chatId)
    ),
  }),

  // Analyses router
  analyses: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserAnalyses(ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getAnalysisById(input.id, ctx.user.id)
    ),

    /** Sohbet bağlamı + istenen konu ile JSON rapor; kapak için DALL·E (OPENAI_API_KEY). */
    generateFromPrompt: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(3).max(8000),
          storeId: z.number(),
          chatId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId, ctx.user.id);
        if (!store) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı" });
        }
        if (input.chatId != null) {
          const ch = await getChatById(input.chatId, ctx.user.id);
          if (!ch) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Sohbet bulunamadı" });
          }
        }
        try {
          const { analysisId } = await createVisualReportFromPrompt({
            userId: ctx.user.id,
            storeId: input.storeId,
            userPrompt: input.prompt,
            chatId: input.chatId,
          });
          return { analysisId };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Rapor oluşturulamadı";
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
        }
      }),
  }),

  // Profile router
  profile: router({
    get: protectedProcedure.query(({ ctx }) =>
      getOrCreateProfile(ctx.user.id)
    ),
  }),

  onboarding: router({
    createDefaultStore: protectedProcedure.mutation(async ({ ctx }) => {
      const name = ctx.user.name ?? ctx.user.email ?? "Kullanıcı";
      return autoStoreCreationService.createDefaultStore(ctx.user.id, name);
    }),
  }),

  /** Tek panel sohbeti: görünür “mağaza” yok; arka planda bir çalışma alanı + danışman sohbeti. */
  workspace: router({
    ensure: protectedProcedure.mutation(async ({ ctx }) => {
      const stores = await getUserStores(ctx.user.id);
      let storeId: number;
      if (stores.length === 0) {
        storeId = await createStoreRecordReturningId(ctx.user.id, {
          name: "Çalışma alanı",
          niche: null,
          website: null,
          targetMarket: null,
          currency: "USD",
          monthlyBudget: null,
          platformFocus: null,
        });
      } else {
        storeId = stores[0]!.id;
      }
      const chatId = await getOrCreateConsultantChatId(ctx.user.id, storeId);
      return { storeId, chatId };
    }),
  }),

  aiChat: router({
    getOrCreateConsultantChat: protectedProcedure
      .input(z.object({ storeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreById(input.storeId, ctx.user.id);
        if (!store) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mağaza bulunamadı" });
        }
        const chatId = await getOrCreateConsultantChatId(ctx.user.id, input.storeId);
        return { chatId };
      }),
  }),

  googleAds: router({
    connect: protectedProcedure
      .input(
        z.object({
          customerId: z.string().min(1),
          refreshToken: z.string().optional(),
          storeId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const refresh =
          input.refreshToken?.trim() || ENV.googleAdsDefaultRefreshToken || null;
        const id = await insertGoogleAdsAccountRow({
          userId: ctx.user.id,
          storeId: input.storeId ?? null,
          customerId: input.customerId,
          refreshToken: refresh,
        });
        if (input.storeId != null) {
          scheduleSixHourJob(`google-${input.storeId}-${id}`, () =>
            autoAnalysisService.analyzeStore(input.storeId!, ctx.user.id)
          );
        }
        return { success: true as const, accountId: id };
      }),

    /** Tarayıcıyı Google OAuth’a yönlendirmek için tam URL (tek tıkla bağla). */
    getOAuthAuthorizationUrl: protectedProcedure
      .input(z.object({ storeId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.googleAdsClientId || !ENV.googleAdsClientSecret) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Google OAuth: GOOGLE_ADS_CLIENT_ID ve GOOGLE_ADS_CLIENT_SECRET gerekli.",
          });
        }
        if (!ENV.oauthStateSecret) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "OAuth state için ADSCORA_OAUTH_STATE_SECRET veya SUPABASE_JWT_SECRET ekleyin.",
          });
        }
        const storeId = input.storeId ?? null;
        if (storeId != null) {
          const st = await getStoreById(storeId, ctx.user.id);
          if (!st) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Mağaza bulunamadı" });
          }
        }
        const state = await signGoogleAdsOAuthState({ userId: ctx.user.id, storeId });
        const url = buildGoogleAdsAuthorizeUrl(state);
        return { url };
      }),

    getCampaigns: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ ctx, input }) => {
        const account = await getGoogleAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const rt = account.refreshToken?.trim() || ENV.googleAdsDefaultRefreshToken;
        if (!rt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Refresh token tanımlı değil" });
        }
        if (!googleAdsService.isConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Google Ads API ortam değişkenleri eksik",
          });
        }
        return googleAdsService.getCampaigns(account.customerId, rt);
      }),

    getMetrics: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          days: z.number().min(1).max(90).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const account = await getGoogleAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const rt = account.refreshToken?.trim() || ENV.googleAdsDefaultRefreshToken;
        if (!rt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Refresh token tanımlı değil" });
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
        return googleAdsService.getMetrics(account.customerId, rt, {
          start: startDate.toISOString().split("T")[0]!,
          end: endDate.toISOString().split("T")[0]!,
        });
      }),

    analyzeAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const account = await getGoogleAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const rt = account.refreshToken?.trim() || ENV.googleAdsDefaultRefreshToken;
        if (!rt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Refresh token tanımlı değil" });
        }
        const metrics = await googleAdsService.analyzePerformance(account.customerId, rt);
        const { analysis } = await autoAnalysisService.quickAnalyzeAccount("google", metrics);
        return { metrics, analysis };
      }),
  }),

  metaAds: router({
    connect: protectedProcedure
      .input(
        z.object({
          adAccountId: z.string().min(1),
          accessToken: z.string().min(1),
          storeId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const token = input.accessToken.trim() || ENV.metaAccessToken;
        if (!token) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Access token gerekli" });
        }
        const id = await insertMetaAdsAccountRow({
          userId: ctx.user.id,
          storeId: input.storeId ?? null,
          adAccountId: input.adAccountId,
          accessToken: token,
        });
        if (input.storeId != null) {
          scheduleSixHourJob(`meta-${input.storeId}-${id}`, () =>
            autoAnalysisService.analyzeStore(input.storeId!, ctx.user.id)
          );
        }
        return { success: true as const, accountId: id };
      }),

    getOAuthAuthorizationUrl: protectedProcedure
      .input(z.object({ storeId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.metaAppId || !ENV.metaAppSecret) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Meta OAuth: META_APP_ID ve META_APP_SECRET gerekli.",
          });
        }
        if (!ENV.oauthStateSecret) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "OAuth state için ADSCORA_OAUTH_STATE_SECRET veya SUPABASE_JWT_SECRET ekleyin.",
          });
        }
        const storeId = input.storeId ?? null;
        if (storeId != null) {
          const st = await getStoreById(storeId, ctx.user.id);
          if (!st) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Mağaza bulunamadı" });
          }
        }
        const state = await signMetaAdsOAuthState({ userId: ctx.user.id, storeId });
        const url = buildMetaAdsAuthorizeUrl(state);
        return { url };
      }),

    getCampaigns: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ ctx, input }) => {
        const account = await getMetaAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const svc = new MetaAdsService(account.accessToken);
        return svc.getCampaigns(account.adAccountId);
      }),

    getMetrics: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          days: z.number().min(1).max(90).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const account = await getMetaAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
        const svc = new MetaAdsService(account.accessToken);
        return svc.getMetrics(account.adAccountId, {
          start: startDate.toISOString().split("T")[0]!,
          end: endDate.toISOString().split("T")[0]!,
        });
      }),

    analyzeAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const account = await getMetaAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const svc = new MetaAdsService(account.accessToken);
        const metrics = await svc.analyzePerformance(account.adAccountId);
        const { analysis } = await autoAnalysisService.quickAnalyzeAccount("meta", metrics);
        return { metrics, analysis };
      }),
  }),

  tikTokAds: router({
    connect: protectedProcedure
      .input(
        z.object({
          advertiserId: z.string().min(1),
          accessToken: z.string().min(1),
          storeId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const token = input.accessToken.trim() || ENV.tikTokAccessToken;
        if (!token) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Access token gerekli" });
        }
        const id = await insertTikTokAdsAccountRow({
          userId: ctx.user.id,
          storeId: input.storeId ?? null,
          advertiserId: input.advertiserId,
          accessToken: token,
        });
        if (input.storeId != null) {
          scheduleSixHourJob(`tiktok-${input.storeId}-${id}`, () =>
            autoAnalysisService.analyzeStore(input.storeId!, ctx.user.id)
          );
        }
        return { success: true as const, accountId: id };
      }),

    getCampaigns: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ ctx, input }) => {
        const account = await getTikTokAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const svc = new TikTokAdsService(account.accessToken);
        return svc.getCampaigns(account.advertiserId);
      }),

    getMetrics: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          days: z.number().min(1).max(90).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const account = await getTikTokAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
        const svc = new TikTokAdsService(account.accessToken);
        return svc.getMetrics(account.advertiserId, {
          start: startDate.toISOString().split("T")[0]!,
          end: endDate.toISOString().split("T")[0]!,
        });
      }),

    analyzeAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const account = await getTikTokAdsAccountForUser(input.accountId, ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
        }
        const svc = new TikTokAdsService(account.accessToken);
        const metrics = await svc.analyzePerformance(account.advertiserId);
        const { analysis } = await autoAnalysisService.quickAnalyzeAccount("tiktok", metrics);
        return { metrics, analysis };
      }),
  }),

  connections: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [google, meta, tiktok] = await Promise.all([
        listGoogleAdsAccountsForUser(ctx.user.id),
        listMetaAdsAccountsForUser(ctx.user.id),
        listTikTokAdsAccountsForUser(ctx.user.id),
      ]);
      return { google, meta, tiktok };
    }),
  }),

  adActions: router({
    list: protectedProcedure
      .input(z.object({ storeId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) =>
        adPlatformActionsService.list(ctx.user.id, input?.storeId)
      ),

    proposeGooglePause: protectedProcedure
      .input(
        z.object({
          googleAdsAccountId: z.number(),
          storeId: z.number().nullable().optional(),
          campaignId: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) =>
        adPlatformActionsService.proposeGooglePauseCampaign({
          userId: ctx.user.id,
          storeId: input.storeId ?? null,
          googleAdsAccountId: input.googleAdsAccountId,
          campaignId: input.campaignId,
        })
      ),

    proposeMetaPause: protectedProcedure
      .input(
        z.object({
          metaAdsAccountId: z.number(),
          storeId: z.number().nullable().optional(),
          campaignId: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) =>
        adPlatformActionsService.proposeMetaPauseCampaign({
          userId: ctx.user.id,
          storeId: input.storeId ?? null,
          metaAdsAccountId: input.metaAdsAccountId,
          campaignId: input.campaignId,
        })
      ),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => adPlatformActionsService.approve(ctx.user.id, input.id)),

    revert: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => adPlatformActionsService.revert(ctx.user.id, input.id)),

    discard: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => adPlatformActionsService.discard(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
