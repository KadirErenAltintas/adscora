import { invokeLLM } from "../_core/llm";

export interface ImageAnalysisResult {
  quality: string;
  designScore: number; // 1-10
  issues: string[];
  suggestions: string[];
  bestPractices: string[];
  warnings: string[];
}

/**
 * Analyze ad creative image for design quality and effectiveness
 */
export async function analyzeCreativeImage(imageUrl: string): Promise<ImageAnalysisResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert ad creative designer and performance marketer. Analyze ad creative images for design quality, effectiveness, and best practices.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ad creative image for:
1. Overall design quality (1-10 score)
2. Specific design issues
3. Improvement suggestions
4. Ad best practices compliance
5. Potential performance warnings

Focus on practical, actionable feedback for e-commerce ads.

Return ONLY valid JSON in this format:
{
  "quality": "brief assessment of overall quality",
  "designScore": 7,
  "issues": ["specific design issue 1", "specific design issue 2"],
  "suggestions": ["actionable improvement 1", "actionable improvement 2"],
  "bestPractices": ["best practice 1", "best practice 2"],
  "warnings": ["performance warning 1"]
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "image_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              quality: { type: "string" },
              designScore: { type: "number", minimum: 1, maximum: 10 },
              issues: { type: "array", items: { type: "string" } },
              suggestions: { type: "array", items: { type: "string" } },
              bestPractices: { type: "array", items: { type: "string" } },
              warnings: { type: "array", items: { type: "string" } },
            },
            required: ["quality", "designScore", "issues", "suggestions", "bestPractices", "warnings"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const analysis = JSON.parse(contentStr) as ImageAnalysisResult;

    return analysis;
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error(`Failed to analyze creative image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
