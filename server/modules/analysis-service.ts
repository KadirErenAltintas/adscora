import { invokeLLM } from "../_core/llm";
import { buildAnalysisSystemPrompt, buildAnalysisUserContext } from "./chat-prompts";
import { logAiRequest, insertAnalysisFromService } from "../db";

export interface AnalysisMetrics {
  campaignName?: string;
  platform?: string;
  objective?: string;
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  revenue?: number;
}

export interface Problem {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number; // 0-100
}

export interface Action {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  expectedImpact: string;
}

export interface StructuredAnalysis {
  summary: string;
  problems: Problem[];
  reasoning: string;
  actions: Action[];
  metricsBreakdown: {
    ctr?: number;
    cpc?: number;
    cpa?: number;
    roas?: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    revenue?: number;
  };
  overallConfidence: number; // 0-100
  nextSteps: string;
}

export interface AnalysisServiceOptions {
  metrics: AnalysisMetrics;
  userId: number;
  storeId: number;
}

export async function generateAnalysis(
  options: AnalysisServiceOptions
): Promise<StructuredAnalysis> {
  const { metrics, userId, storeId } = options;

  // Calculate derived metrics
  const ctr = metrics.impressions && metrics.clicks ? (metrics.clicks / metrics.impressions) * 100 : undefined;
  const cpc = metrics.spend && metrics.clicks ? metrics.spend / metrics.clicks : undefined;
  const cpa = metrics.spend && metrics.conversions ? metrics.spend / metrics.conversions : undefined;
  const roas = metrics.revenue && metrics.spend ? metrics.revenue / metrics.spend : undefined;

  const systemPrompt = buildAnalysisSystemPrompt();
  const userContext = buildAnalysisUserContext(metrics);

  const analysisPrompt = `${userContext}\n\nHesaplanan Metrikler:\n- CTR: ${ctr?.toFixed(2)}%\n- CPC: $${cpc?.toFixed(2)}\n- CPA: $${cpa?.toFixed(2)}\n- ROAS: ${roas?.toFixed(2)}:1\n\nLütfen aşağıdaki JSON formatında yapılandırılmış bir analiz sağla:\n{\n  "summary": "Kampanyanın genel durumunun kısa özeti",\n  "problems": [\n    {\n      "title": "Problem başlığı",\n      "description": "Detaylı açıklama",\n      "severity": "critical|high|medium|low",\n      "confidence": 85\n    }\n  ],\n  "reasoning": "Sorunların neden oluştuğunun detaylı açıklaması",\n  "actions": [\n    {\n      "title": "Eylem başlığı",\n      "description": "Detaylı açıklama",\n      "priority": "high|medium|low",\n      "expectedImpact": "Beklenen sonuç"\n    }\n  ],\n  "overallConfidence": 85,\n  "nextSteps": "Sonraki adımlar"\n}`;

  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: analysisPrompt },
  ];

  const startTime = Date.now();

  try {
    const response = await invokeLLM({
      messages: llmMessages,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;
    const aiFeedback = typeof content === "string" ? content : "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    // Parse structured analysis from LLM response
    let structuredAnalysis: StructuredAnalysis;
    try {
      const jsonMatch = aiFeedback.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiFeedback;
      const parsed = JSON.parse(jsonStr);
      
      structuredAnalysis = {
        summary: parsed.summary || "Analiz tamamlandı",
        problems: parsed.problems || [],
        reasoning: parsed.reasoning || "",
        actions: parsed.actions || [],
        metricsBreakdown: {
          ctr,
          cpc,
          cpa,
          roas,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          spend: metrics.spend,
          revenue: metrics.revenue,
        },
        overallConfidence: parsed.overallConfidence || 75,
        nextSteps: parsed.nextSteps || "Önerileri uygulayarak kampanyanızı optimize edin",
      };
    } catch {
      // Fallback to simple analysis if JSON parsing fails
      structuredAnalysis = {
        summary: aiFeedback.substring(0, 200),
        problems: [
          {
            title: "Kampanya Performansı",
            description: aiFeedback,
            severity: "medium",
            confidence: 70,
          },
        ],
        reasoning: "AI tarafından oluşturulan analiz",
        actions: [
          {
            title: "Kampanyayı Gözden Geçir",
            description: "Detaylı metrikleri inceleyerek optimizasyon fırsatlarını belirleyin",
            priority: "high",
            expectedImpact: "Performans iyileştirmesi",
          },
        ],
        metricsBreakdown: {
          ctr,
          cpc,
          cpa,
          roas,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          spend: metrics.spend,
          revenue: metrics.revenue,
        },
        overallConfidence: 70,
        nextSteps: "Önerileri uygulayarak kampanyanızı optimize edin",
      };
    }

    // Log AI request
    await logAiRequest({
      userId,
      storeId,
      feature: "analysis",
      model: "gpt-4",
      status: "success",
      inputTokens,
      outputTokens,
      latencyMs,
    });

    await insertAnalysisFromService({
      userId,
      storeId,
      campaignName: metrics.campaignName ?? null,
      platform: metrics.platform ?? null,
      objective: metrics.objective ?? null,
      impressions: metrics.impressions ?? null,
      clicks: metrics.clicks ?? null,
      spend: metrics.spend != null ? String(metrics.spend) : null,
      conversions: metrics.conversions ?? null,
      revenue: metrics.revenue != null ? String(metrics.revenue) : null,
      ctr: ctr != null ? String(ctr) : null,
      cpc: cpc != null ? String(cpc) : null,
      cpa: cpa != null ? String(cpa) : null,
      roas: roas != null ? String(roas) : null,
      resultSummary: structuredAnalysis.summary,
      aiFeedback: JSON.stringify(structuredAnalysis),
    });

    return structuredAnalysis;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    await logAiRequest({
      userId,
      storeId,
      feature: "analysis",
      model: "gpt-4",
      status: "error",
      latencyMs,
      errorMessage,
    });

    throw error;
  }
}
