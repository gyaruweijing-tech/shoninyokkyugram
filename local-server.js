/*
 * ローカル実験用サーバー（依存ゼロ・Node標準のみ）
 *
 * 使い方:
 *   1. .env.example をコピーして .env を作り、GEMINI_API_KEY=... を書く（.envはgit管理外）
 *   2. node local-server.js
 *   3. http://localhost:3456 を開く
 *
 * Vercelにデプロイした時は api/ がそのまま使われるので、このファイルは本番では使われない。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3456;
const ROOT = __dirname;

/* ---- .env 読み込み（値はログに一切出さない） ---- */
try {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch (e) {
  // .env が無くても起動はする（AI機能だけ503になる）
}

const apiComments = require("./api/comments.js");
const apiCaption = require("./api/caption.js");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/* Vercel互換の res シム */
function shimRes(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(obj) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(obj));
    },
  };
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  /* ---- API ---- */
  if (pathname === "/api/comments" || pathname === "/api/caption") {
    try {
      const raw = await readBody(req, 8 * 1024 * 1024);
      req.body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return shimRes(res).status(400).json({ error: "invalid body" });
    }
    const handler = pathname === "/api/comments" ? apiComments : apiCaption;
    try {
      return await handler(req, shimRes(res));
    } catch (e) {
      console.error("api error:", e.message);
      return shimRes(res).status(500).json({ error: "internal" });
    }
  }

  /* ---- 静的ファイル ---- */
  let file = pathname === "/" ? "/index.html" : pathname;
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  // ドットファイル（.env等）と api/ ソースは配信しない
  if (path.basename(file).startsWith(".") || file.replace(/\\/g, "/").startsWith("/api/")) {
    res.statusCode = 404;
    return res.end("not found");
  }
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) {
    res.statusCode = 403;
    return res.end("forbidden");
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.statusCode = 404;
      return res.end("not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(full)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  });
});

server.listen(PORT, () => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  console.log("Shoninyokkyugram local server: http://localhost:" + PORT);
  console.log("GEMINI_API_KEY: " + (hasKey ? "設定済み ✅（AIコメント使えます）" : "未設定 ⚠️（.envを作るとAIコメントが動きます）"));
});
