import { ENV } from "./env";
import type { Message } from "./llm";
import {
  defaultChatModel,
  isOpenAIChatCompletionsEndpoint,
  resolveChatCompletionsUrl,
} from "./llmEndpoint";

export async function createChatCompletionStream(messages: Message[]): Promise<Response> {
  if (!ENV.forgeApiKey) {
    throw new Error("LLM anahtarı yok: OPENAI_API_KEY veya BUILT_IN_FORGE_API_KEY");
  }

  const payload: Record<string, unknown> = {
    model: defaultChatModel(),
    messages,
    stream: true,
    max_tokens: isOpenAIChatCompletionsEndpoint() ? 4096 : 8192,
  };

  return fetch(resolveChatCompletionsUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });
}
