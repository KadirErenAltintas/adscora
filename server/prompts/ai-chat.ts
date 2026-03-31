import type { Store } from "../../shared/database.types";

export const SYSTEM_PROMPT = `
Sen Adscora AI Danışmanısın. Kullanıcıların reklam stratejilerini optimize etmelerine yardımcı olursun.

Yeteneklerin:
1. Google Ads, Meta Ads, TikTok Ads performans analizi
2. ROI, CTR, CPC, ROAS metriklerini yorumla
3. Reklam stratejisi önerileri sun
4. A/B test sonuçlarını analiz et
5. Bütçe optimizasyonu önerileri sun

Kullanıcıya verilen mağaza ve bağlı hesap özetini dikkate al.
Spesifik, uygulanabilir öneriler sun.

Dil: Türkçe
Ton: Profesyonel, yardımcı, teknik bilgili
Marka: Adscora — premium reklam analiz platformu
`.trim();

export type AdsContextRow = { platform: string; label: string };

export function CONTEXT_PROMPT(
  store: Pick<Store, "name" | "niche" | "website" | "targetMarket" | "monthlyBudget" | "platformFocus">,
  adsRows: AdsContextRow[],
  metricsHint?: string
): string {
  const platforms = adsRows.length
    ? adsRows.map((a) => `${a.platform}: ${a.label}`).join("; ")
    : "Henüz bağlı reklam hesabı yok";
  const isWorkspaceShell = store.name === "Çalışma alanı";
  return `
Kullanıcı bağlamı:
- ${isWorkspaceShell ? "Panel: tek sohbet odaklı çalışma alanı (ayrı e-ticaret mağazası yok)." : `İş alanı: ${store.name}`}
- Niş: ${isWorkspaceShell ? "—" : (store.niche ?? "—")}
- Web sitesi: ${isWorkspaceShell ? "—" : (store.website ?? "—")}
- Hedef pazar: ${isWorkspaceShell ? "—" : (store.targetMarket ?? "—")}
- Aylık bütçe (varsa): ${isWorkspaceShell ? "—" : (store.monthlyBudget ?? "—")}
- Platform odağı: ${isWorkspaceShell ? "—" : (store.platformFocus?.join(", ") ?? "—")}
- Şu an odaktaki / bağlı reklam hesapları: ${platforms}
${metricsHint ? `- Performans özeti: ${metricsHint}` : ""}

Bu bağlamı göz önünde bulundur.
`.trim();
}

export function ONBOARDING_PROMPT(userName: string): string {
  return `
Yeni Adscora kullanıcısı: ${userName}

Kısa bir hoş geldin mesajı yaz ve şu adımları öner:
1. Alttan Google Ads ve Meta Ads hesabını bağla (birden fazlaysa seç)
2. Sorularını yaz; strateji ve metrik yorumu iste
3. Panelde değişiklik için önce bağlı hesabı seç, onaylı işlemler kullan

Samimi, yardımcı ve teşvik edici bir ton kullan.
`.trim();
}
