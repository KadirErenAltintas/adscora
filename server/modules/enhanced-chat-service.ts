import { invokeLLM } from "../_core/llm";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  storeNiche?: string;
  campaignObjective?: string;
  platform?: string;
  previousMetrics?: {
    ctr?: number;
    cpc?: number;
    roas?: number;
  };
}

/**
 * Enhanced chat service with context memory and strategist guidance
 */
export async function chatWithStrategist(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  try {
    // Build system prompt with context
    let systemPrompt = `You are Adscora, an expert ad performance strategist and marketing consultant.

Your personality:
- Knowledgeable but approachable (explain like talking to a smart friend)
- Practical and action-oriented (give specific, implementable advice)
- Honest about what data shows (don't pretend certainty where there isn't any)
- Beginner-friendly (explain marketing terms simply)
- Step-by-step guidance (break complex strategies into clear steps)

Your approach:
1. Ask clarifying questions if needed
2. Provide specific, actionable recommendations
3. Explain the "why" behind suggestions
4. Reference industry benchmarks when relevant
5. Suggest next steps and metrics to track

Remember: You're helping e-commerce businesses optimize their ad performance.`;

    if (context) {
      if (context.storeNiche) systemPrompt += `\n\nStore Niche: ${context.storeNiche}`;
      if (context.campaignObjective) systemPrompt += `\nCampaign Objective: ${context.campaignObjective}`;
      if (context.platform) systemPrompt += `\nPlatform: ${context.platform}`;
      if (context.previousMetrics) {
        systemPrompt += `\nRecent Performance:`;
        if (context.previousMetrics.ctr) systemPrompt += `\n- CTR: ${context.previousMetrics.ctr.toFixed(2)}%`;
        if (context.previousMetrics.cpc) systemPrompt += `\n- CPC: $${context.previousMetrics.cpc.toFixed(2)}`;
        if (context.previousMetrics.roas) systemPrompt += `\n- ROAS: ${context.previousMetrics.roas.toFixed(2)}x`;
      }
    }

    // Build messages array
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    const response = await invokeLLM({
      messages: messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const responseText = typeof content === "string" ? content : JSON.stringify(content);
    return responseText;
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error(`Failed to process chat message: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate step-by-step guidance for a specific task
 */
export async function generateStepByStepGuidance(task: string, context?: ChatContext): Promise<string> {
  try {
    const systemPrompt = `You are an expert marketing strategist providing step-by-step guidance.

Format your response as a clear, numbered action plan:
1. [First step with specific details]
2. [Second step with specific details]
3. [Continue...]

Each step should be:
- Specific and actionable
- Include expected outcomes
- Mention any tools or data needed
- Reference success metrics

Keep language simple and beginner-friendly.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `${task}${
            context
              ? `\n\nContext: ${context.storeNiche ? `Store: ${context.storeNiche}` : ""} ${
                  context.platform ? `Platform: ${context.platform}` : ""
                }`
              : ""
          }`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("Guidance generation error:", error);
    throw new Error(
      `Failed to generate guidance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
