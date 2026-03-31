import { invokeLLM } from "../_core/llm";
import {
  listAllStores,
  listGoogleAdsAccountsForUser,
  listMetaAdsAccountsForUser,
  listTikTokAdsAccountsForUser,
  insertAutoPlatformAnalysis,
} from "../db";
import { googleAdsService } from "../integrations/google-ads";
import { MetaAdsService } from "../integrations/meta-ads";
import { TikTokAdsService } from "../integrations/tiktok-ads";
import type { AdPlatform } from "../../shared/database.types";

type ParsedAuto = {
  summary: string;
  problems: string[];
  opportunities: string[];
  recommendations: string[];
  budgetOptimization: string;
  confidence: number;
};

function parseLlmJson(content: string): ParsedAuto {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as ParsedAuto;
  } catch {
    return {
      summary: trimmed.slice(0, 2000),
      problems: [],
      opportunities: [],
      recommendations: [],
      budgetOptimization: "",
      confidence: 50,
    };
  }
}

async function llmStructuredAnalysis(platformLabel: string, metrics: unknown): Promise<ParsedAuto> {
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Sen ${platformLabel} uzmanısın. Adscora için performans özetini JSON ile döndür.`,
      },
      {
        role: "user",
        content: `Platform özeti. Metrikler:\n${JSON.stringify(metrics, null, 2)}\n\nŞu alanlarda JSON döndür: summary (string), problems (string[]), opportunities (string[]), recommendations (string[]), budgetOptimization (string), confidence (0-100 number).`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ad_analysis",
        strict: false,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            problems: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            budgetOptimization: { type: "string" },
            confidence: { type: "number" },
          },
          required: [
            "summary",
            "problems",
            "opportunities",
            "recommendations",
            "budgetOptimization",
            "confidence",
          ],
        },
      },
    },
  });

  const raw = res.choices[0]?.message?.content;
  const text = typeof raw === "string" ? raw : "";
  return parseLlmJson(text);
}

export class AutoAnalysisService {
  async runDailyAnalysis(): Promise<void> {
    const stores = await listAllStores();
    for (const store of stores) {
      await this.analyzeStore(store.id, store.userId);
    }
  }

  async analyzeStore(storeId: number, userId: number): Promise<void> {
    const googleAccounts = await listGoogleAdsAccountsForUser(userId, storeId);
    for (const acc of googleAccounts) {
      const token = acc.refreshToken?.trim();
      if (!token) continue;
      try {
        const metrics = await googleAdsService.analyzePerformance(acc.customerId, token);
        const parsed = await llmStructuredAnalysis("Google Ads", metrics);
        await insertAutoPlatformAnalysis({
          userId,
          storeId,
          platform: "google",
          metricsBreakdown: metrics,
          executiveSummary: parsed.summary,
          mainProblems: parsed.problems,
          recommendedActions: parsed.recommendations,
          resultSummary: parsed.opportunities.join("\n"),
          reasoning: parsed.budgetOptimization,
        });
      } catch (e) {
        console.error("[auto-analysis] google", storeId, e);
      }
    }

    const metaAccounts = await listMetaAdsAccountsForUser(userId, storeId);
    for (const acc of metaAccounts) {
      try {
        const svc = new MetaAdsService(acc.accessToken);
        const metrics = await svc.analyzePerformance(acc.adAccountId);
        const parsed = await llmStructuredAnalysis("Meta Ads", metrics);
        await insertAutoPlatformAnalysis({
          userId,
          storeId,
          platform: "meta",
          metricsBreakdown: metrics,
          executiveSummary: parsed.summary,
          mainProblems: parsed.problems,
          recommendedActions: parsed.recommendations,
          resultSummary: parsed.opportunities.join("\n"),
          reasoning: parsed.budgetOptimization,
        });
      } catch (e) {
        console.error("[auto-analysis] meta", storeId, e);
      }
    }

    const tikTokAccounts = await listTikTokAdsAccountsForUser(userId, storeId);
    for (const acc of tikTokAccounts) {
      try {
        const svc = new TikTokAdsService(acc.accessToken);
        const metrics = await svc.analyzePerformance(acc.advertiserId);
        const parsed = await llmStructuredAnalysis("TikTok Ads", metrics);
        await insertAutoPlatformAnalysis({
          userId,
          storeId,
          platform: "tiktok",
          metricsBreakdown: metrics,
          executiveSummary: parsed.summary,
          mainProblems: parsed.problems,
          recommendedActions: parsed.recommendations,
          resultSummary: parsed.opportunities.join("\n"),
          reasoning: parsed.budgetOptimization,
        });
      } catch (e) {
        console.error("[auto-analysis] tiktok", storeId, e);
      }
    }
  }

  async quickAnalyzeAccount(
    platform: AdPlatform,
    metrics: unknown
  ): Promise<{ metrics: unknown; analysis: string }> {
    const label =
      platform === "google"
        ? "Google Ads"
        : platform === "meta"
          ? "Meta Ads"
          : platform === "tiktok"
            ? "TikTok Ads"
            : "Reklam";
    const parsed = await llmStructuredAnalysis(label, metrics);
    const analysis = [
      parsed.summary,
      "",
      "Öneriler:",
      ...parsed.recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      `Bütçe: ${parsed.budgetOptimization}`,
    ].join("\n");
    return { metrics, analysis };
  }
}

export const autoAnalysisService = new AutoAnalysisService();
