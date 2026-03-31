/**
 * Kapak görseli — yalnızca OPENAI_API_KEY + api.openai.com ile.
 * İçerik politikası: soyut, metinsiz infografik tarzı.
 */
export async function generateReportCoverImage(englishSceneDescription: string): Promise<string | null> {
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!key) return null;

  const prompt = [
    "Abstract professional digital advertising analytics illustration.",
    "Dark theme, emerald and deep blue accents, subtle charts and upward trends.",
    "No text, no letters, no logos. Clean corporate art style.",
    englishSceneDescription.slice(0, 400),
  ].join(" ");

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 1000),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn("[openai-image]", res.status, t.slice(0, 300));
      return null;
    }
    const j = (await res.json()) as {
      data?: Array<{ url?: string }>;
    };
    const url = j.data?.[0]?.url;
    return typeof url === "string" && url.length > 0 ? url.slice(0, 2000) : null;
  } catch (e) {
    console.warn("[openai-image] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
