import { invokeLLM } from "../_core/llm";
import {
  createStoreRecordReturningId,
  createChatRecordReturningId,
  insertMessageRow,
  setProfileOnboardingCompleted,
} from "../db";
import { ONBOARDING_PROMPT } from "../prompts/ai-chat";

const DEFAULT_CHAT_TITLE = "Reklam Stratejisi Danışması";

export class AutoStoreCreationService {
  async createDefaultStore(userId: number, userName: string): Promise<{ storeId: number; chatId: number }> {
    const storeId = await createStoreRecordReturningId(userId, {
      name: `${userName || "Kullanıcı"} — Mağaza`,
      niche: "e-ticaret",
      website: null,
      targetMarket: null,
      currency: "TRY",
      monthlyBudget: null,
      platformFocus: ["google", "meta"],
    });

    const chatId = await createChatRecordReturningId(userId, storeId, DEFAULT_CHAT_TITLE);

    const welcome = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Sen Adscora AI Danışmanısın. Yeni kullanıcıya kısa bir hoş geldin mesajı yaz; Türkçe, samimi ve net ol.",
        },
        { role: "user", content: ONBOARDING_PROMPT(userName || "Kullanıcı") },
      ],
    });

    const text = welcome.choices[0]?.message?.content;
    const content = typeof text === "string" ? text : "";

    await insertMessageRow({
      chatId,
      role: "assistant",
      content: content || "Adscora'ya hoş geldiniz! Mağazanızı ve reklam hesaplarınızı bağlayarak başlayabilirsiniz.",
      model: welcome.model,
      tokenUsageInput: welcome.usage?.prompt_tokens ?? null,
      tokenUsageOutput: welcome.usage?.completion_tokens ?? null,
    });

    await setProfileOnboardingCompleted(userId, 1);

    return { storeId, chatId };
  }
}

export const autoStoreCreationService = new AutoStoreCreationService();
