import cron from "node-cron";
import { autoAnalysisService } from "../services/auto-analysis";

cron.schedule("0 2 * * *", () => {
  console.log("[cron] Günlük Adscora analizi başlıyor…");
  void autoAnalysisService.runDailyAnalysis().then(
    () => console.log("[cron] Günlük analiz tamamlandı."),
    (e) => console.error("[cron] Günlük analiz hatası:", e)
  );
});
