/* feed.js — コメント生成・コメントシート・返信・フィード・投稿フロー・演出 */
"use strict";

/* ================= comments ================= */
function weightedPersona() {
  var keys = Object.keys(DB.PERSONAS);
  var total = 0;
  keys.forEach(function (k) { total += DB.PERSONAS[k].weight; });
  var r = Math.random() * total;
  for (var i = 0; i < keys.length; i++) {
    r -= DB.PERSONAS[keys[i]].weight;
    if (r <= 0) return keys[i];
  }
  return "generic";
}
function makeName(base) {
  var suffix = ["", "_", "." + rand(1, 99), rand(10, 999) + "", "_x"];
  return base + pick(suffix);
}
function buildComments() {
  var count = rand(30, 50);
  var list = [];
  for (var i = 0; i < count; i++) {
    var pk = weightedPersona();
    var p = DB.PERSONAS[pk];
    list.push({
      name: makeName(pick(p.names)),
      text: pick(p.texts),
      verified: !!p.verified,
      likes: Math.random() < 0.3 ? rand(50, 3000) : rand(2, 40),
      ai: false
    });
  }
  // アンチ→擁護の小芝居を6割の確率で差し込む（順序保持）
  if (Math.random() < 0.6) {
    var drama = pick(DB.ANTI_DRAMA);
    var pos = rand(5, Math.max(6, list.length - drama.length));
    drama.forEach(function (d, j) {
      var nm = d.p === "anti" ? pick(DB.ANTI_NAMES) : makeName(pick(DB.PERSONAS[d.p === "overseas" ? "overseas" : d.p].names));
      list.splice(pos + j, 0, {
        name: nm, text: d.t, verified: false,
        likes: d.p === "anti" ? rand(0, 3) : rand(100, 2500), ai: false
      });
    });
  }
  return list;
}

function replyEl(r) {
  var div = document.createElement("div");
  div.className = "reply";
  div.appendChild(r.mine ? myAvatarEl() : avatarEl(r.name));
  var rb = document.createElement("div");
  rb.className = "rb";
  var rn = document.createElement("span");
  rn.className = "rn";
  rn.textContent = r.name;
  rb.appendChild(rn);
  if (r.mine) rn.insertAdjacentHTML("afterend", VBADGE + " ");
  rb.appendChild(document.createTextNode(r.text));
  div.appendChild(rb);
  return div;
}

/* 本人が書き込むとファンが沸く */
function fanEruption(c, post, repliesWrap) {
  var n = rand(2, 4);
  for (var j = 0; j < n; j++) {
    (function (j) {
      setTimeout(function () {
        var fan = {
          name: makeName(pick(DB.PERSONAS.fan.names.concat(DB.PERSONAS.gal.names))),
          text: pick(DB.REPLY_FAN),
          mine: false
        };
        c.replies.push(fan);
        repliesWrap.appendChild(replyEl(fan));
        if (j === n - 1) persist(post);
      }, 900 + j * rand(1000, 1800));
    })(j);
  }
}

function commentEl(c, post) {
  var div = document.createElement("div");
  div.className = "comment" + (c.ai ? " ai-comment" : "");
  div.appendChild(c.mine ? myAvatarEl() : avatarEl(c.name));
  var body = document.createElement("div");
  body.className = "body";
  var head = document.createElement("span");
  head.className = "cu";
  head.textContent = c.name;
  if (c.verified || c.mine) head.insertAdjacentHTML("beforeend", VBADGE);
  var txt = document.createElement("div");
  txt.className = "ct";
  txt.textContent = c.text;
  var meta = document.createElement("div");
  meta.className = "meta";
  var likesSpan = document.createElement("span");
  likesSpan.textContent = "いいね" + fmtShort(Math.max(1, c.likes || 1)) + "件";
  var replyBtn = document.createElement("span");
  replyBtn.textContent = "返信する";
  replyBtn.style.cursor = "pointer";
  meta.appendChild(likesSpan);
  meta.appendChild(replyBtn);
  body.appendChild(head); body.appendChild(txt); body.appendChild(meta);

  // 既存の返信を描画
  var repliesWrap = document.createElement("div");
  repliesWrap.className = "replies";
  c.replies = c.replies || [];
  c.replies.forEach(function (r) { repliesWrap.appendChild(replyEl(r)); });
  body.appendChild(repliesWrap);

  // 返信入力（開閉式）
  var inputRow = null;
  replyBtn.addEventListener("click", function () {
    if (inputRow) { inputRow.querySelector("input").focus(); return; }
    inputRow = document.createElement("div");
    inputRow.className = "reply-input-row";
    var inp = document.createElement("input");
    inp.placeholder = c.name + " さんに返信…";
    inp.maxLength = 200;
    var send = document.createElement("button");
    send.textContent = "送信";
    function doSend() {
      var t = inp.value.trim();
      if (!t) return;
      var mine = { name: HANDLE, mine: true, text: t };
      c.replies.push(mine);
      repliesWrap.appendChild(replyEl(mine));
      inp.value = "";
      c.likes = (c.likes || 0) + rand(200, 1200); // 本人返信でコメントも伸びる
      likesSpan.textContent = "いいね" + fmtShort(c.likes) + "件";
      persist(post);
      fanEruption(c, post, repliesWrap);
    }
    send.addEventListener("click", doSend);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSend(); });
    inputRow.appendChild(inp);
    inputRow.appendChild(send);
    body.appendChild(inputRow);
    inp.focus();
  });

  div.appendChild(body);
  var h = document.createElement("button");
  h.className = "cheart";
  h.textContent = "♡";
  div.appendChild(h);
  return div;
}

var sheetPost = null;
function openCommentSheet(post) {
  sheetPost = post;
  var listEl = $("commentsList");
  listEl.innerHTML = "";
  post.comments.forEach(function (c) { listEl.appendChild(commentEl(c, post)); });
  var slot = $("ciAvatarSlot");
  slot.innerHTML = "";
  slot.appendChild(myAvatarEl());
  $("commentSheet").classList.add("open");
}

/* シート下部から自分の新規コメント */
function submitOwnComment() {
  var post = sheetPost;
  if (!post) return;
  var inp = $("commentInput");
  var t = inp.value.trim();
  if (!t) return;
  inp.value = "";
  var cm = { name: HANDLE, mine: true, text: t, verified: true, likes: 0, ai: false, replies: [] };
  post.comments.push(cm);
  var listEl = $("commentsList");
  var el = commentEl(cm, post);
  listEl.appendChild(el);
  listEl.scrollTop = listEl.scrollHeight;
  var vc = document.querySelector('[data-id="' + post.id + '"] .view-comments');
  if (vc) vc.textContent = "コメント" + post.comments.length + "件をすべて見る";
  persist(post);
  fanEruption(cm, post, el.querySelector(".replies"));
}

/* ================= feed ================= */
function likesLineText(post) {
  return "いいね！" + fmt(post.likesShown) + "件";
}
function renderPost(post, prepend) {
  var el = document.createElement("article");
  el.className = "post";
  el.dataset.id = post.id;

  var head = document.createElement("div");
  head.className = "post-head";
  head.appendChild(myAvatarEl());
  var un = document.createElement("span");
  un.className = "uname";
  un.textContent = HANDLE;
  un.insertAdjacentHTML("beforeend", VBADGE);
  head.appendChild(un);
  el.appendChild(head);

  var wrap = document.createElement("div");
  wrap.className = "post-img-wrap";
  var img = document.createElement("img");
  img.className = "post-img";
  img.src = post.url;
  img.alt = "";
  wrap.appendChild(img);
  el.appendChild(wrap);

  var actions = document.createElement("div");
  actions.className = "post-actions";
  actions.innerHTML =
    '<button class="icon-btn heart-btn' + (post.myLike ? " liked" : "") + '" aria-label="いいね"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>' +
    '<button class="icon-btn cmt-btn" aria-label="コメント"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg></button>' +
    '<button class="icon-btn share2-btn" aria-label="シェア"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button>' +
    '<span class="spacer"></span>' +
    '<button class="icon-btn save-btn" aria-label="保存"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M19 21 12 16 5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/></svg></button>';
  el.appendChild(actions);

  var likes = document.createElement("div");
  likes.className = "likes-line";
  likes.textContent = likesLineText(post);
  el.appendChild(likes);

  var cap = document.createElement("div");
  cap.className = "caption-line";
  var u = document.createElement("span");
  u.className = "u";
  u.textContent = HANDLE;
  cap.appendChild(u);
  cap.appendChild(document.createTextNode(post.caption || ""));
  el.appendChild(cap);

  var vc = document.createElement("button");
  vc.className = "view-comments";
  vc.textContent = "コメント" + post.comments.length + "件をすべて見る";
  el.appendChild(vc);

  var ins = document.createElement("button");
  ins.className = "view-comments";
  ins.style.color = "#0095f6";
  ins.textContent = "インサイトを見る";
  el.appendChild(ins);

  var tm = document.createElement("div");
  tm.className = "post-time";
  tm.textContent = timeAgo(post.time);
  el.appendChild(tm);

  // events
  actions.querySelector(".heart-btn").addEventListener("click", function () {
    post.myLike = !post.myLike;
    this.classList.toggle("liked", post.myLike);
    post.likesShown += post.myLike ? 1 : -1;
    likes.textContent = likesLineText(post);
    if (post.myLike) flyHearts(this, 3);
    persist(post);
  });
  actions.querySelector(".cmt-btn").addEventListener("click", function () { openCommentSheet(post); });
  vc.addEventListener("click", function () { openCommentSheet(post); });
  ins.addEventListener("click", function () { openInsights(post); });
  actions.querySelector(".share2-btn").addEventListener("click", function () { toast("シェアは Coming soon 🚧"); });
  actions.querySelector(".save-btn").addEventListener("click", function () { toast("保存しました（あなたの端末の中に）"); });
  img.addEventListener("dblclick", function (e) {
    if (!post.myLike) actions.querySelector(".heart-btn").click();
    flyHearts(img, 5, e);
  });

  var feed = $("feed");
  if (prepend && feed.firstChild) feed.insertBefore(el, feed.firstChild);
  else feed.appendChild(el);
  return { el: el, likesEl: likes, vcEl: vc };
}

function flyHearts(anchor, n, evt) {
  var r = anchor.getBoundingClientRect();
  for (var i = 0; i < n; i++) {
    (function (i) {
      setTimeout(function () {
        var h = document.createElement("span");
        h.className = "fly-heart";
        h.textContent = "❤️";
        var x = evt ? evt.clientX : r.left + r.width / 2;
        var y = evt ? evt.clientY : r.top;
        h.style.left = (x + rand(-30, 30)) + "px";
        h.style.top = (y + rand(-10, 10)) + "px";
        document.body.appendChild(h);
        setTimeout(function () { h.remove(); }, 1400);
      }, i * 120);
    })(i);
  }
}

function persist(post) {
  dbPut({
    id: post.id, blob: post.blob, caption: post.caption,
    likesTarget: post.likesTarget, likesShown: post.likesShown,
    comments: post.comments, time: post.time, buzz: post.buzz, myLike: post.myLike
  }).catch(function () {});
}

/* ================= insights ================= */
function openInsights(post) {
  var L = post.likesTarget;
  var rows = [
    ["リーチしたアカウント数", Math.round(L * (3.2 + Math.random())), 1],
    ["インプレッション", Math.round(L * (5.5 + Math.random() * 2)), 1],
    ["いいね", post.likesShown, 0.6],
    ["保存数", Math.round(L * 0.09), 0.35],
    ["プロフィールへのアクセス", Math.round(L * 0.14), 0.4],
    ["この投稿からのフォロー", Math.round(L * 0.02), 0.25]
  ];
  var body = $("insightBody");
  body.innerHTML = "<h3>この投稿のパフォーマンス 🚀</h3>";
  rows.forEach(function (r) {
    var d = document.createElement("div");
    d.className = "bar-row";
    d.innerHTML = '<div class="bl"><span>' + r[0] + '</span><b>' + fmt(r[1]) + '</b></div><div class="bar"><i></i></div>';
    body.appendChild(d);
  });
  var note = document.createElement("p");
  note.className = "insight-note";
  note.textContent = "同カテゴリのインフルエンサー上位1%のパフォーマンスです（当社比）";
  body.appendChild(note);
  $("insightSheet").classList.add("open");
  setTimeout(function () {
    body.querySelectorAll(".bar i").forEach(function (bar, i) {
      bar.style.width = Math.round(rows[i][2] * 100) + "%";
    });
  }, 60);
}

/* ================= the show（投稿後の演出） ================= */
function rollBuzz() {
  var r = Math.random();
  if (r < 0.06) return { level: 2, likes: rand(500000, 2000000) };   // 大バズ
  if (r < 0.30) return { level: 1, likes: rand(30000, 200000) };     // 中バズ
  return { level: 0, likes: rand(3000, 30000) };
}

function animateLikes(post, likesEl, duration) {
  // rAFはバックグラウンドタブで止まるので、時刻ベースのintervalで確実に完走させる
  var start = Date.now();
  var timer = setInterval(function () {
    var t = Math.min(1, (Date.now() - start) / duration);
    var eased = 1 - Math.pow(1 - t, 3);
    post.likesShown = Math.round(post.likesTarget * eased);
    likesEl.textContent = likesLineText(post);
    if (t >= 1) {
      clearInterval(timer);
      persist(post);
    }
  }, 60);
}

function followerRush(buzzLevel) {
  var times = buzzLevel === 2 ? 5 : buzzLevel === 1 ? 3 : 2;
  for (var i = 0; i < times; i++) {
    (function (i) {
      setTimeout(function () {
        var gain = rand(300, 2200) * (buzzLevel === 2 ? 8 : buzzLevel === 1 ? 3 : 1);
        followers += gain;
        LS.set("followers", followers);
        toast("フォロワー +" + fmt(gain) + "人 🎉");
        updateProfileStats();
      }, 2500 + i * 3600);
    })(i);
  }
}

function scheduleDm(buzzLevel) {
  var delay = rand(8000, 18000);
  setTimeout(function () {
    var c = pick(DB.DM_COMPANIES);
    dms.unshift({ name: c.name, msg: c.msg, time: Date.now() });
    unreadDms++;
    LS.set("dms", dms); LS.set("unreadDms", unreadDms);
    updateBadges();
    banner("📩", c.name, "PRのご相談が届きました");
    if (buzzLevel === 2) {
      setTimeout(function () {
        var c2 = pick(DB.DM_COMPANIES.filter(function (x) { return x.name !== c.name; }));
        dms.unshift({ name: c2.name, msg: c2.msg, time: Date.now() });
        unreadDms++;
        LS.set("dms", dms); LS.set("unreadDms", unreadDms);
        updateBadges();
        banner("📩", c2.name, "アンバサダー契約のご相談が届きました");
      }, 6000);
    }
  }, delay);
}

function burstComments(post, handles) {
  var i = 0;
  var listEl = $("commentsList");
  function next() {
    if (i >= post.comments.length) { persist(post); return; }
    var c = post.comments[i];
    if ($("commentSheet").classList.contains("open") && sheetPost === post) {
      listEl.appendChild(commentEl(c, post));
      listEl.scrollTop = listEl.scrollHeight;
    }
    i++;
    handles.vcEl.textContent = "コメント" + i + "件をすべて見る";
    setTimeout(next, rand(60, 160));
  }
  next();
}

function fetchAiComments(post, handles) {
  blobToResizedBase64(post.blob, 768, 0.8).then(function (b64) {
    return fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: b64.data, mime: b64.mime, caption: post.caption })
    });
  }).then(function (r) {
    if (!r.ok) throw new Error("api " + r.status);
    return r.json();
  }).then(function (data) {
    var arr = (data && data.comments) || [];
    if (!arr.length) return;
    toast("✨ 写真を見たフォロワーからコメントが届き始めました");
    arr.forEach(function (c, j) {
      setTimeout(function () {
        var cm = {
          name: String(c.name || "fan_" + rand(1, 999)).slice(0, 30),
          text: String(c.text || "").slice(0, 200),
          verified: false, likes: rand(20, 1500), ai: true
        };
        post.comments.push(cm);
        if ($("commentSheet").classList.contains("open") && sheetPost === post) {
          var listEl = $("commentsList");
          listEl.appendChild(commentEl(cm, post));
          listEl.scrollTop = listEl.scrollHeight;
        }
        handles.vcEl.textContent = "コメント" + post.comments.length + "件をすべて見る";
        if (j === arr.length - 1) persist(post);
      }, 800 + j * rand(900, 1600));
    });
  }).catch(function () {
    // ローカル実行や未設定時は静かにテンプレのみで続行
  });
}

/* ================= compose flow ================= */
var pendingFile = null;
var pendingUrl = null;

function openCompose(file) {
  pendingFile = file;
  if (pendingUrl) URL.revokeObjectURL(pendingUrl);
  pendingUrl = URL.createObjectURL(file);
  $("previewImg").src = pendingUrl;
  $("previewThumb").src = pendingUrl;
  $("captionInput").value = "";
  renderTmplChips();
  $("cmStep1").hidden = false;
  $("cmStep2").hidden = true;
  $("composeModal").classList.add("open");
}

function renderTmplChips(aiCaptions) {
  var row = $("tmplRow");
  row.innerHTML = "";
  var picks = [];
  if (aiCaptions) {
    picks = aiCaptions.map(function (t) { return { t: t, ai: true }; });
  } else {
    var pool = DB.CAPTION_TMPL.slice();
    for (var i = 0; i < 4; i++) picks.push({ t: pool.splice(Math.floor(Math.random() * pool.length), 1)[0] });
  }
  picks.forEach(function (p) {
    var c = document.createElement("button");
    c.className = "chip" + (p.ai ? " ai" : "");
    c.textContent = p.t;
    c.addEventListener("click", function () { $("captionInput").value = p.t; });
    row.appendChild(c);
  });
  var aiChip = document.createElement("button");
  aiChip.className = "chip ai";
  aiChip.textContent = "✨ AIに提案してもらう";
  aiChip.addEventListener("click", function () {
    aiChip.textContent = "✨ 考え中…";
    blobToResizedBase64(pendingFile, 640, 0.75).then(function (b64) {
      return fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64.data, mime: b64.mime })
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("api " + r.status);
      return r.json();
    }).then(function (d) {
      if (d && d.captions && d.captions.length) renderTmplChips(d.captions.slice(0, 3));
      else throw new Error("empty");
    }).catch(function () {
      aiChip.textContent = "✨ AI提案（Web公開版で使えます）";
      toast("AI提案はWeb公開版（API設定後）で使えます");
    });
  });
  row.appendChild(aiChip);
}

function share() {
  if (!pendingFile) return;
  var caption = $("captionInput").value.trim();
  var aiOn = $("aiToggle").checked;
  $("composeModal").classList.remove("open");
  toast("投稿中…");

  fileToResizedBlob(pendingFile, 1080, 0.85).then(function (blob) {
    var buzz = rollBuzz();
    var post = {
      id: Date.now() + "-" + rand(100, 999),
      blob: blob,
      url: URL.createObjectURL(blob),
      caption: caption,
      likesTarget: buzz.likes,
      likesShown: 0,
      comments: buildComments(),
      time: Date.now(),
      buzz: buzz.level,
      myLike: false
    };
    posts.unshift(post);
    switchView("home");
    window.scrollTo({ top: 0 });
    var handles = renderPost(post, true);
    handles.vcEl.textContent = "コメント0件";
    persist(post);
    updateProfileStats();

    // ===== 演出開始 =====
    animateLikes(post, handles.likesEl, buzz.level === 2 ? 6000 : 4000);
    flyHearts(handles.el.querySelector(".post-img"), buzz.level === 2 ? 14 : 8);
    setTimeout(function () { burstComments(post, handles); }, 900);
    followerRush(buzz.level);
    scheduleDm(buzz.level);
    unreadNotifs += rand(25, 80) * (buzz.level === 2 ? 3 : 1);
    LS.set("unreadNotifs", unreadNotifs);
    updateBadges();
    if (aiOn) fetchAiComments(post, handles);
    if (buzz.level === 2) {
      setTimeout(function () {
        $("buzzText").textContent = pick(DB.BUZZ_TEXTS);
        $("buzzOverlay").classList.add("show");
      }, 2600);
    } else if (buzz.level === 1) {
      setTimeout(function () {
        banner("🚀", BRAND, pick(DB.BUZZ_TEXTS));
      }, 3000);
    }
  }).catch(function (e) {
    toast("画像の読み込みに失敗しました: " + e.message);
  });
  pendingFile = null;
}
