import { ENV } from "./env";

/** Chat Completions tam URL. Yalnızca OPENAI_API_KEY tanımlıysa api.openai.com; aksi Forge proxy. */
export function resolveChatCompletionsUrl(): string {
  const base = ENV.forgeApiUrl?.trim();
  if (base) return `${base.replace(/\/$/, "")}/v1/chat/completions`;
  if ((process.env.OPENAI_API_KEY ?? "").trim().length > 0) {
    return "https://api.openai.com/v1/chat/completions";
  }
  return "https://forge.manus.im/v1/chat/completions";
}

export function isOpenAIChatCompletionsEndpoint(): boolean {
  return resolveChatCompletionsUrl().includes("api.openai.com");
}

export function defaultChatModel(): string {
  return isOpenAIChatCompletionsEndpoint() ? ENV.openaiChatModel : "gemini-2.5-flash";
}
