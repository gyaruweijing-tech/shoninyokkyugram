/*
 * Gemini 共通ヘルパー（"_" 始まりのファイルはVercelのAPIルートにならない）
 * APIキーは環境変数 GEMINI_API_KEY からのみ読む。コードにもレスポンスにも絶対に出さない。
 */

const MODEL = "gemini-2.5-flash";
const MAX_BASE64_LENGTH = 3.5 * 1024 * 1024; // ~2.6MB実データ

// 簡易レート制限（インメモリ。インスタンス再起動でリセットされる割り切り運用）
const hits = new Map();
let globalCount = 0;
let globalDay = "";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rateLimit(ip) {
  const day = today();
  if (globalDay !== day) {
    globalDay = day;
    globalCount = 0;
    hits.clear();
  }
  if (globalCount >= 400) return "サービス全体の本日の上限に達しました。また明日！";
  const rec = hits.get(ip) || { count: 0 };
  if (rec.count >= 40) return "本日の利用上限に達しました。また明日！";
  rec.count++;
  hits.set(ip, rec);
  globalCount++;
  return null;
}

function validateImage(body) {
  if (!body || typeof body !== "object") return "invalid body";
  const { image, mime } = body;
  if (typeof image !== "string" || image.length === 0) return "image required";
  if (image.length > MAX_BASE64_LENGTH) return "image too large";
  if (typeof mime !== "string" || !mime.startsWith("image/")) return "invalid mime";
  return null;
}

async function callGemini(apiKey, mime, imageBase64, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mime, data: imageBase64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 1.1,
          maxOutputTokens: 2048,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`gemini ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("empty response");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function getIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || "unknown";
}

module.exports = { rateLimit, validateImage, callGemini, getIp };
