import { invokeLLM } from "../_core/llm";

export interface AnalysisInput {
  platform: "meta" | "google" | "tiktok" | "other";
  campaignObjective: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  revenue?: number;
  notes?: string;
  creativeImageUrl?: string;
}

export interface MetricsCalculated {
  ctr: number;
  cpc: number;
  cpa?: number;
  roas?: number;
}

export interface ProblemDetected {
  issue: string;
  severity: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
}

export interface RecommendedAction {
  action: string;
  priority: "high" | "medium" | "low";
  impact: string;
}

export interface AnalysisOutput {
  executiveSummary: string;
  mainProblems: ProblemDetected[];
  reasoning: string;
  recommendedActions: RecommendedAction[];
  metricsBreakdown: Record<string, string>;
  missingDataWarnings: string[];
  creativeAnalysis?: {
    quality: string;
    issues: string[];
    suggestions: string[];
  };
}

/**
 * Calculate missing metrics from available data
 */
export function calculateMetrics(input: AnalysisInput): MetricsCalculated {
  const ctr = input.impressions > 0 ? (input.clicks / input.impressions) * 100 : 0;
  const cpc = input.clicks > 0 ? input.spend / input.clicks : 0;

  let cpa: number | undefined;
  let roas: number | undefined;

  if (input.conversions && input.conversions > 0) {
    cpa = input.spend / input.conversions;
  }

  if (input.revenue && input.spend > 0) {
    roas = input.revenue / input.spend;
  }

  return { ctr, cpc, cpa, roas };
}

/**
 * Advanced analysis engine - professional ad diagnosis
 */
export async function analyzeAdPerformance(input: AnalysisInput): Promise<AnalysisOutput> {
  const metrics = calculateMetrics(input);
  const warnings: string[] = [];

  // Check for missing data
  if (!input.conversions) warnings.push("Conversions data not provided - CPA calculation skipped");
  if (!input.revenue) warnings.push("Revenue data not provided - ROAS calculation skipped");
  if (!input.notes) warnings.push("Campaign notes not provided - context limited");

  // Build context for LLM
  const metricsContext = `
Campaign Metrics:
- Platform: ${input.platform}
- Objective: ${input.campaignObjective}
- Impressions: ${input.impressions.toLocaleString()}
- Clicks: ${input.clicks.toLocaleString()}
- Spend: $${input.spend.toFixed(2)}
- CTR: ${metrics.ctr.toFixed(2)}%
- CPC: $${metrics.cpc.toFixed(2)}
${input.conversions ? `- Conversions: ${input.conversions}` : ""}
${input.conversions ? `- CPA: $${metrics.cpa?.toFixed(2)}` : ""}
${input.revenue ? `- Revenue: $${input.revenue.toFixed(2)}` : ""}
${input.revenue ? `- ROAS: ${metrics.roas?.toFixed(2)}x` : ""}
${input.notes ? `- Notes: ${input.notes}` : ""}
  `;

  const prompt = `You are a professional performance marketing expert analyzing ad campaign data.

${metricsContext}

Analyze this campaign and provide a structured diagnosis. Be specific, practical, and honest about what the data shows.

IMPORTANT RULES:
1. Do NOT give generic advice
2. Do NOT pretend certainty where data is missing
3. Speak like a real marketing expert, not a chatbot
4. Focus on actionable insights
5. Explain metrics simply for beginners

Provide your analysis in this EXACT JSON format:
{
  "executiveSummary": "2-3 sentence overview of campaign health",
  "mainProblems": [
    {
      "issue": "specific problem detected",
      "severity": "high|medium|low",
      "confidence": "high|medium|low"
    }
  ],
  "reasoning": "explain WHY these problems exist based on the metrics",
  "recommendedActions": [
    {
      "action": "specific action to take",
      "priority": "high|medium|low",
      "impact": "expected impact if implemented"
    }
  ],
  "metricsBreakdown": {
    "CTR": "explanation of what this means",
    "CPC": "explanation of what this means",
    "CPA": "explanation if available",
    "ROAS": "explanation if available"
  },
  "creativeAnalysis": {
    "quality": "assessment of creative quality if image provided",
    "issues": ["specific design issues"],
    "suggestions": ["improvement suggestions"]
  }
}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional ad performance analyst. Provide structured, honest, and actionable feedback.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ad_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string" },
              mainProblems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    issue: { type: "string" },
                    severity: { enum: ["high", "medium", "low"] },
                    confidence: { enum: ["high", "medium", "low"] },
                  },
                  required: ["issue", "severity", "confidence"],
                },
              },
              reasoning: { type: "string" },
              recommendedActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    priority: { enum: ["high", "medium", "low"] },
                    impact: { type: "string" },
                  },
                  required: ["action", "priority", "impact"],
                },
              },
              metricsBreakdown: {
                type: "object",
                additionalProperties: { type: "string" },
              },
              creativeAnalysis: {
                type: "object",
                properties: {
                  quality: { type: "string" },
                  issues: { type: "array", items: { type: "string" } },
                  suggestions: { type: "array", items: { type: "string" } },
                },
              },
            },
            required: [
              "executiveSummary",
              "mainProblems",
              "reasoning",
              "recommendedActions",
              "metricsBreakdown",
            ],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const analysis = JSON.parse(contentStr) as AnalysisOutput;
    analysis.missingDataWarnings = warnings;

    return analysis;
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error(`Failed to analyze campaign: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
