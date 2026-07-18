/*
 * POST /api/comments — 写真の中身に触れるインフルエンサー風コメントを生成
 * body: { image: base64(jpeg), mime: "image/jpeg", caption?: string }
 * 返却: { comments: [{ name, text }] }
 */
const { rateLimit, validateImage, callGemini, getIp } = require("./_gemini.js");

const PROMPT = `あなたは日本のインスタグラムのコメント欄そのものです。
この写真に対して、インフルエンサーの投稿に付くようなファンのコメントを8個生成してください。

ルール:
- 必ず写真に写っている具体的な内容（物・場所・色・雰囲気など）に触れること
- ペルソナを混ぜる: ギャル系 / 海外ファン(英語やスペイン語) / おじさん構文(カタカナ多め絵文字多め) / 意識高い系 / 熱狂的ファン
- 1コメントは短め(10〜60文字)。絵文字も使う
- name はそれっぽいインスタのユーザー名(英数字とアンダースコアとドット)
- 誹謗中傷や個人特定につながる内容は禁止。写真の人物の容姿はほめる場合のみ言及可
- キャプションがある場合はそれにも反応してよい

JSON配列のみを返す: [{"name": "...", "text": "..."}]`;

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
    const caption = typeof req.body.caption === "string" ? req.body.caption.slice(0, 300) : "";
    const prompt = caption ? `${PROMPT}\n\n投稿のキャプション: 「${caption}」` : PROMPT;
    const parsed = await callGemini(apiKey, req.body.mime, req.body.image, prompt);
    const comments = (Array.isArray(parsed) ? parsed : [])
      .slice(0, 10)
      .map((c) => ({
        name: String(c.name || "").slice(0, 30) || "fan_account",
        text: String(c.text || "").slice(0, 200),
      }))
      .filter((c) => c.text);
    return res.status(200).json({ comments });
  } catch (e) {
    console.error("comments error:", e.message);
    return res.status(502).json({ error: "generation failed" });
  }
};
