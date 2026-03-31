import { invokeLLM } from "../_core/llm";
import type { Message } from "../_core/llm";
import { generateReportCoverImage } from "../integrations/openai-image";
import { getChatById, getChatMessages, insertAiGeneratedAnalysisRow } from "../db";

const JSON_INSTRUCTION = `Yanıtın YALNIZCA tek bir JSON nesnesi olmalı (markdown yok). Anahtarlar:
campaignName (string),
platform ("meta"|"google"|"tiktok"|"other"),
objective (string),
executiveSummary (string, Türkçe),
resultSummary (string, Türkçe, kısa),
reasoning (string, Türkçe),
mainProblems (array of {issue, severity: "high"|"medium"|"low", confidence: "high"|"medium"|"low"}),
recommendedActions (array of {action, priority: "high"|"medium"|"low", impact}),
metricsBreakdown (object: her değer string, Türkçe açıklama; örn. {"CTR":"..."}),
missingDataWarnings (array of string),
notes (string).
Sayısal metrikler bilinmiyorsa null kullan: impressions, clicks, spend, conversions, revenue, ctr, cpc, cpa, roas — bunları da JSON köküne ekle (number veya null; spend/revenue string ondalık da olabilir).`;

export async function createVisualReportFromPrompt(opts: {
  userId: number;
  storeId: number;
  userPrompt: string;
  chatId?: number;
}): Promise<{ analysisId: number }> {
  if (opts.chatId != null) {
    const chat = await getChatById(opts.chatId, opts.userId);
    if (!chat || chat.storeId !== opts.storeId) {
      throw new Error("Sohbet bulunamadı veya mağaza eşleşmiyor");
    }
  }

  let transcript = "";
  if (opts.chatId != null) {
    const msgs = await getChatMessages(opts.chatId);
    transcript = msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-24)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");
  }

  const userBlock = [
    `Kullanıcı rapor isteği: ${opts.userPrompt}`,
    transcript ? `\nSon sohbet özeti:\n${transcript}` : "",
  ].join("");

  const messages: Message[] = [
    {
      role: "system",
      content: `Sen Adscora için reklam analisti raporu üretirsin. ${JSON_INSTRUCTION}`,
    },
    { role: "user", content: userBlock },
  ];

  const r = await invokeLLM({
    messages,
    response_format: { type: "json_object" },
  });

  const raw = r.choices[0]?.message?.content;
  const text = typeof raw === "string" ? raw : "";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Model geçerli JSON döndürmedi; tekrar deneyin.");
  }

  const toStr = (v: unknown): string | null =>
    v == null ? null : typeof v === "string" ? v : String(v);
  const toNum = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const imageUrl = await generateReportCoverImage(
    String(parsed.executiveSummary ?? parsed.resultSummary ?? "advertising performance")
  );

  const analysisId = await insertAiGeneratedAnalysisRow({
    userId: opts.userId,
    storeId: opts.storeId,
    campaignName: toStr(parsed.campaignName),
    platform: toStr(parsed.platform) as "meta" | "google" | "tiktok" | "other" | null,
    objective: toStr(parsed.objective),
    impressions: toNum(parsed.impressions),
    clicks: toNum(parsed.clicks),
    spend: parsed.spend != null ? toStr(parsed.spend) : null,
    conversions: toNum(parsed.conversions),
    revenue: parsed.revenue != null ? toStr(parsed.revenue) : null,
    ctr: parsed.ctr != null ? toStr(parsed.ctr) : null,
    cpc: parsed.cpc != null ? toStr(parsed.cpc) : null,
    cpa: parsed.cpa != null ? toStr(parsed.cpa) : null,
    roas: parsed.roas != null ? toStr(parsed.roas) : null,
    notes: toStr(parsed.notes),
    creativeImageUrl: imageUrl,
    executiveSummary: toStr(parsed.executiveSummary) ?? "Özet oluşturulamadı.",
    mainProblems: parsed.mainProblems ?? [],
    reasoning: toStr(parsed.reasoning),
    recommendedActions: parsed.recommendedActions ?? [],
    metricsBreakdown: parsed.metricsBreakdown ?? {},
    missingDataWarnings: parsed.missingDataWarnings ?? [],
    resultSummary: toStr(parsed.resultSummary),
    aiFeedback: "AI görsel rapor (sohbet bağlamı + DALL·E kapak)",
  });

  return { analysisId };
}
