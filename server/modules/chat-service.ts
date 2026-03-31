import { invokeLLM } from "../_core/llm";
import { buildChatSystemPrompt, buildChatUserContext } from "./chat-prompts";
import type { Store, Message } from "../../shared/database.types";
import { logAiRequest } from "../db";

export interface ChatServiceOptions {
  store: Store;
  messages: Message[];
  userMessage: string;
  userId: number;
  storeId: number;
}

export async function generateChatResponse(options: ChatServiceOptions): Promise<{
  response: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { store, messages, userMessage, userId, storeId } = options;

  const systemPrompt = buildChatSystemPrompt(store);
  const userContext = buildChatUserContext(userMessage);

  // Build message history for LLM
  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userContext },
  ];

  const startTime = Date.now();

  try {
    const response = await invokeLLM({
      messages: llmMessages,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;
    const responseText = typeof content === "string" ? content : "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    // Log AI request
    await logAiRequest({
      userId,
      storeId,
      feature: "chat",
      model: "gpt-4",
      status: "success",
      inputTokens,
      outputTokens,
      latencyMs,
    });

    return {
      response: responseText,
      inputTokens,
      outputTokens,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    await logAiRequest({
      userId,
      storeId,
      feature: "chat",
      model: "gpt-4",
      status: "error",
      latencyMs,
      errorMessage,
    });

    throw error;
  }
}
