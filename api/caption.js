/*
 * POST /api/caption — 写真からインフルエンサー風キャプションを3つ提案
 * body: { image: base64(jpeg), mime: "image/jpeg" }
 * 返却: { captions: [string, string, string] }
 */
const { rateLimit, validateImage, callGemini, getIp } = require("./_gemini.js");

const PROMPT = `この写真のインスタグラム投稿用キャプションを3つ提案してください。

ルール:
- 日本のインフルエンサーが書きそうな文体(絵文字・改行なしの短文)
- 1つは真面目におしゃれ、1つは少しあざとい、1つはちょっと笑える方向
- それぞれ15〜60文字
- 写真の内容に必ず触れる

JSON配列のみを返す: ["...", "...", "..."]`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
  }
  const limited = rateLimit(getIp(req));
  if (limited) return res.status(429).json({ error: limited });

  const invalid = validateImage(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const parsed = await callGemini(apiKey, req.body.mime, req.body.image, PROMPT);
    const captions = (Array.isArray(parsed) ? parsed : [])
      .slice(0, 3)
      .map((c) => String(c).slice(0, 120))
      .filter(Boolean);
    return res.status(200).json({ captions });
  } catch (e) {
    console.error("caption error:", e.message);
    return res.status(502).json({ error: "generation failed" });
  }
};
