import type { Express, Request, Response } from "express";
import { invokeLLM } from "../_core/llm";
import type { Message } from "../_core/llm";
import { createChatCompletionStream } from "../_core/llmStream";
import { authenticateSupabaseRequest } from "../_core/supabaseAuth";
import {
  getChatById,
  getChatMessages,
  getGoogleAdsAccountForUser,
  getMetaAdsAccountForUser,
  getStoreById,
  insertMessageRow,
  listGoogleAdsAccountsForUser,
  listMetaAdsAccountsForUser,
  listTikTokAdsAccountsForUser,
} from "../db";
import { defaultChatModel } from "../_core/llmEndpoint";
import { CONTEXT_PROMPT, SYSTEM_PROMPT, type AdsContextRow } from "../prompts/ai-chat";

function accumulateFromSseChunk(carry: string, chunk: string, onDelta: (s: string) => void): string {
  let buf = carry + chunk;
  const lines = buf.split("\n");
  const rest = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") continue;
    try {
      const j = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
      };
      const c = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content;
      if (typeof c === "string" && c.length > 0) onDelta(c);
    } catch {
      /* ignore partial JSON */
    }
  }
  return rest;
}

async function fallbackNonStream(
  res: Response,
  llmMessages: Message[],
  chatId: number
): Promise<void> {
  const r = await invokeLLM({ messages: llmMessages });
  const text = r.choices[0]?.message?.content;
  const content = typeof text === "string" ? text : "";
  await insertMessageRow({
    chatId,
    role: "assistant",
    content,
    model: r.model,
    tokenUsageInput: r.usage?.prompt_tokens ?? null,
    tokenUsageOutput: r.usage?.completion_tokens ?? null,
  });
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}

export function registerAiChatStreamRoute(app: Express): void {
  app.post("/api/ai-chat/stream", async (req: Request, res: Response) => {
    const user = await authenticateSupabaseRequest(req);
    if (!user) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const chatId = Number(req.body?.chatId);
    const content = String(req.body?.content ?? "").trim();
    const ctxGoogleId = Number(req.body?.googleAdsAccountId);
    const ctxMetaId = Number(req.body?.metaAdsAccountId);
    const useGoogleCtx = Number.isFinite(ctxGoogleId) && ctxGoogleId > 0;
    const useMetaCtx = Number.isFinite(ctxMetaId) && ctxMetaId > 0;
    if (!Number.isFinite(chatId) || chatId <= 0 || !content) {
      res.status(400).json({ error: "chatId ve content gerekli" });
      return;
    }

    const chat = await getChatById(chatId, user.id);
    if (!chat) {
      res.status(404).json({ error: "Sohbet bulunamadı" });
      return;
    }

    const store = await getStoreById(chat.storeId, user.id);
    if (!store) {
      res.status(404).json({ error: "Mağaza bulunamadı" });
      return;
    }

    try {
      await insertMessageRow({ chatId, role: "user", content });
    } catch {
      res.status(500).json({ error: "Mesaj kaydedilemedi" });
      return;
    }

    const history = await getChatMessages(chatId);
    const adsRows: AdsContextRow[] = [];

    if (useGoogleCtx) {
      const g = await getGoogleAdsAccountForUser(ctxGoogleId, user.id);
      if (g) {
        adsRows.push({
          platform: "Google Ads (seçili)",
          label: `Müşteri ${g.customerId} · kayıt #${g.id}`,
        });
      }
    } else {
      for (const a of await listGoogleAdsAccountsForUser(user.id)) {
        adsRows.push({ platform: "Google Ads", label: `Müşteri ${a.customerId} · #${a.id}` });
      }
    }

    if (useMetaCtx) {
      const m = await getMetaAdsAccountForUser(ctxMetaId, user.id);
      if (m) {
        adsRows.push({
          platform: "Meta Ads (seçili)",
          label: `${m.adAccountId} · kayıt #${m.id}`,
        });
      }
    } else {
      for (const a of await listMetaAdsAccountsForUser(user.id)) {
        adsRows.push({ platform: "Meta Ads", label: `${a.adAccountId} · #${a.id}` });
      }
    }

    for (const a of await listTikTokAdsAccountsForUser(user.id)) {
      adsRows.push({ platform: "TikTok Ads", label: `${a.advertiserId} · #${a.id}` });
    }

    const contextBlock = CONTEXT_PROMPT(store, adsRows);
    const llmMessages: Message[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
      },
      ...history
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
    ];

    let upstream: globalThis.Response;
    try {
      upstream = await createChatCompletionStream(llmMessages);
    } catch {
      await fallbackNonStream(res, llmMessages, chatId);
      return;
    }

    if (!upstream.ok || !upstream.body) {
      await fallbackNonStream(res, llmMessages, chatId);
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let carry = "";
    let assistant = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        res.write(text);
        carry = accumulateFromSseChunk(carry, text, (s) => {
          assistant += s;
        });
      }
      carry = accumulateFromSseChunk(carry, "\n", () => {});
    } catch (e) {
      console.error("[ai-chat/stream] okuma:", e);
    }

    if (!assistant.trim()) {
      try {
        const r = await invokeLLM({ messages: llmMessages });
        const text = r.choices[0]?.message?.content;
        assistant = typeof text === "string" ? text : "";
        await insertMessageRow({
          chatId,
          role: "assistant",
          content: assistant,
          model: r.model,
          tokenUsageInput: r.usage?.prompt_tokens ?? null,
          tokenUsageOutput: r.usage?.completion_tokens ?? null,
        });
      } catch (e2) {
        console.error("[ai-chat/stream] LLM fallback:", e2);
      }
    } else {
      try {
        await insertMessageRow({
          chatId,
          role: "assistant",
          content: assistant,
          model: defaultChatModel(),
        });
      } catch (e) {
        console.error("[ai-chat/stream] assistant kayıt:", e);
      }
    }

    res.end();
  });
}
