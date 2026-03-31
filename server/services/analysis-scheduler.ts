/**
 * Bellek içi 6 saatlik hatırlatıcılar (sunucu yeniden başlayınca sıfırlanır).
 * Üretimde kalıcı zamanlama için harici cron / queue önerilir.
 */
const intervals = new Map<string, ReturnType<typeof setInterval>>();

export function scheduleSixHourJob(key: string, job: () => Promise<void>): void {
  if (intervals.has(key)) return;
  const id = setInterval(() => {
    void job().catch((err) => console.error("[analysis-scheduler]", key, err));
  }, 6 * 60 * 60 * 1000);
  if (typeof (id as NodeJS.Timeout).unref === "function") {
    (id as NodeJS.Timeout).unref();
  }
  intervals.set(key, id);
}
