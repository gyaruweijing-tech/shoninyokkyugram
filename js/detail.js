/* detail.js — 投稿詳細（本家スクショ準拠）
   読み込み順: … → user.js → detail.js → main.js

   これまで「タップの行き止まり」だった3箇所（検索タブのセル／プロフィールのグリッド／
   通知のサムネ）を、すべてこの画面に集約する。
   呼び出し側はバラバラの形のデータを渡してくるので、openPostDetail が正規化してから描く。 */
"use strict";

var pdCurrent = null;
var pdBackStack = [];

/* 呼び出し元の形を1つの形に揃える。
   受け付ける形:
     { post }                    … 自分の投稿（IndexedDBのオブジェクト）
     { account, cell, index }    … 他人のプロフィールのグリッド
     { seed, kw, user, ... }     … 検索タブ・通知など単発のセル */
function normalizeDetail(src) {
  if (src.post) {
    var p = src.post;
    ensureMetrics(p);
    return {
      user: profile.handle, name: profile.name, icon: profile.avatar,
      verified: true, mine: true,
      img: p.url, date: pdDate(p.time),
      likes: p.likesShown != null ? p.likesShown : p.likesTarget,
      cmt: (p.comments || []).length, rep: p.reposts || 0, send: p.shares || 0,
      caption: p.caption || "", pages: 1, post: p
    };
  }
  if (src.account) {
    var a = src.account, c = src.cell;
    var rng = uRng(uSeed(a.handle + "#post" + src.index));
    /* いいね数はフォロワー数に対して自然な範囲に（多すぎ・少なすぎを避ける） */
    var likes = Math.max(3, Math.round(a.followers * (0.02 + rng() * 0.09)));
    var pages = c.multi ? uInt(rng, 2, 6) : 1;
    return {
      imgs: pdImgs(c.kw, c.lock, pages),
      user: a.handle, name: a.name, icon: a.icon, verified: a.verified, mine: false,
      img: kwImg(c.kw, 900, 900, c.lock),
      imgSeed: "pd-" + a.handle + src.index,
      date: pdAgoDate(uInt(rng, 1, 400)),
      likes: likes,
      cmt: Math.max(1, Math.round(likes * (0.01 + rng() * 0.03))),
      rep: Math.max(0, Math.round(likes * rng() * 0.01)),
      send: Math.max(0, Math.round(likes * (0.005 + rng() * 0.02))),
      caption: pdCaption(a, rng),
      pages: pages
    };
  }
  /* 検索タブのセルなど（ユーザーが決まっていないので、seedから決定的に選ぶ） */
  var r = uRng(uSeed(src.seed || "pd"));
  var handle = src.user || uPick(r, DB.FOLLOWER_VIPS.concat(DB.SUGGEST_ACCOUNTS));
  var acc = userAccount(handle);
  var lk = src.views ? Math.round(src.views * (0.03 + r() * 0.05))
                     : Math.max(20, Math.round(acc.followers * (0.03 + r() * 0.08)));
  return {
    user: acc.handle, name: acc.name, icon: acc.icon, verified: acc.verified, mine: false,
    img: src.img || kwImg(src.kw || "photo", 900, 900, (uSeed(src.seed || "pd") % 900) + 1),
    imgSeed: "pd-" + (src.seed || "x"),
    date: pdAgoDate(uInt(r, 1, 200)),
    likes: lk,
    cmt: Math.max(1, Math.round(lk * 0.02)),
    rep: Math.round(lk * 0.004),
    send: Math.round(lk * 0.012),
    caption: src.text ? src.text.replace(/\n/g, " ") : pdCaption(acc, r),
    pages: 1
  };
}

/* カルーセルの各ページの画像URL。lockをずらすだけなので同じ投稿なら毎回同じ並びになる。
   1枚目はグリッドのサムネと必ず一致させる（違う写真が出ると偽物っぽくなるため）。 */
function pdImgs(kw, lock, pages) {
  var out = [];
  for (var i = 0; i < pages; i++) {
    out.push(kwImg(kw, 900, 900, i === 0 ? lock : ((lock + i * 137) % 900) + 1));
  }
  return out;
}

function pdDate(ts) {
  var d = new Date(ts);
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
}
function pdAgoDate(daysAgo) {
  return pdDate(Date.now() - daysAgo * 86400000);
}
/* その人のbioの雰囲気に寄せたキャプション（無ければ汎用） */
function pdCaption(a, rng) {
  var base = a.bio && a.bio.length ? uPick(rng, a.bio) : "今日の記録";
  var tails = ["", " 📸", "\nまた行きたい〜", " #日常", "\n最高でした✨", " 🙏", "\n見てくれてありがとう"];
  return base + uPick(rng, tails);
}

function openPostDetail(src) {
  var cur = document.querySelector(".view.active");
  pdBackStack.push(cur ? cur.id.replace("view-", "") : "home");
  pdCurrent = normalizeDetail(src);
  renderPostDetail();
  switchView("detail");
  window.scrollTo(0, 0);
}

function detailBack() {
  var prev = pdBackStack.pop() || "home";
  /* 他人のプロフィールへ戻る時は、その人の画面を組み直してから戻す */
  if (prev === "user" && upCurrent) { renderUserProfile(); }
  switchView(prev);
}

function renderPostDetail() {
  var d = pdCurrent;
  if (!d) return;

  $("pdTitleUser").textContent = d.user;
  var fb = $("pdFollow");
  fb.hidden = d.mine;
  if (!d.mine) {
    var on = upFollowing.indexOf(d.user) >= 0;
    fb.textContent = on ? "フォロー中" : "フォロー";
    fb.classList.toggle("following", on);
  }

  var body = $("pdBody");
  body.innerHTML = "";

  /* --- 投稿者の行 --- */
  var head = document.createElement("div");
  head.className = "pd-head";
  head.appendChild(d.mine ? myAvatarEl() : userAvatarEl({ handle: d.user, icon: d.icon }));
  var hb = document.createElement("div");
  hb.className = "pd-head-body";
  var un = document.createElement("div");
  un.className = "pd-user";
  un.appendChild(document.createTextNode(d.user));
  if (d.verified) un.insertAdjacentHTML("beforeend", VBADGE);
  un.addEventListener("click", function () { openUserProfile(d.user); });
  var dt = document.createElement("div");
  dt.className = "pd-date";
  dt.textContent = d.date;
  hb.appendChild(un); hb.appendChild(dt);
  head.appendChild(hb);
  var more = document.createElement("button");
  more.className = "pd-more";
  more.setAttribute("aria-label", "その他");
  more.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
  more.addEventListener("click", function () { openPostMenu(d.post || null); });
  head.appendChild(more);
  body.appendChild(head);

  /* --- 画像（複数枚なら横スワイプできるカルーセル） --- */
  var media = document.createElement("div");
  media.className = "pd-media";
  var pages = d.pages > 1 ? d.pages : 1;
  var urls = d.imgs && d.imgs.length ? d.imgs : [d.img];

  if (pages > 1) {
    var track = document.createElement("div");
    track.className = "pd-track";
    urls.forEach(function (u, i) {
      var im = document.createElement("img");
      im.alt = "";
      im.src = u;
      if (d.imgSeed) imgFallback(im, d.imgSeed + "-" + i, 900, 900);
      track.appendChild(im);
    });
    media.appendChild(track);
    var counter = document.createElement("div");
    counter.className = "pd-count";
    counter.textContent = "1/" + pages;
    media.appendChild(counter);
    body.appendChild(media);

    /* --- ドット（スクロール位置と連動） --- */
    var dots = document.createElement("div");
    dots.className = "pd-dots";
    for (var i = 0; i < pages; i++) {
      var dot = document.createElement("span");
      dot.className = "pd-dot" + (i === 0 ? " on" : "");
      dots.appendChild(dot);
    }
    body.appendChild(dots);

    var cur = 0;
    track.addEventListener("scroll", function () {
      var w = track.clientWidth || 1;
      var idx = Math.max(0, Math.min(pages - 1, Math.round(track.scrollLeft / w)));
      if (idx === cur) return;
      cur = idx;
      counter.textContent = (idx + 1) + "/" + pages;
      [].forEach.call(dots.children, function (el, j) { el.classList.toggle("on", j === idx); });
    }, { passive: true });
    /* PCでも見られるように、画像の左右クリックで前後へ（スマホはスワイプ） */
    track.addEventListener("click", function (e) {
      var r = track.getBoundingClientRect();
      var next = cur + (e.clientX - r.left > r.width / 2 ? 1 : -1);
      if (next < 0 || next >= pages) return;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    });
  } else {
    var img = document.createElement("img");
    img.alt = "";
    img.src = urls[0];
    if (d.imgSeed) imgFallback(img, d.imgSeed, 900, 900);
    media.appendChild(img);
    body.appendChild(media);
  }

  /* --- アクション行（フィードと同じ見た目・同じ挙動） --- */
  body.appendChild(pdActions(d));

  /* --- キャプション --- */
  var cap = document.createElement("div");
  cap.className = "pd-caption";
  var b = document.createElement("b");
  b.textContent = d.user;
  b.addEventListener("click", function () { openUserProfile(d.user); });
  cap.appendChild(b);
  var full = d.caption || "";
  var short = full.length > 42 ? full.slice(0, 42) + "… " : full;
  cap.appendChild(document.createTextNode(short));
  if (full.length > 42) {
    var mt = document.createElement("span");
    mt.className = "pd-more-text";
    mt.textContent = "続きを読む";
    mt.addEventListener("click", function () {
      cap.removeChild(mt);
      cap.lastChild.textContent = full;
    });
    cap.appendChild(mt);
  }
  body.appendChild(cap);

  /* --- 返信 --- */
  var rep = document.createElement("div");
  rep.className = "pd-reply";
  rep.textContent = "返信";
  rep.addEventListener("click", function () {
    if (d.post) openCommentSheet(d.post);
    else toast("この投稿へのコメントは Coming soon 🚧");
  });
  body.appendChild(rep);
}

/* ♡ / 💬 / 🔁 / ✈ ……… 🔖 */
function pdActions(d) {
  var row = document.createElement("div");
  row.className = "post-actions";

  var like = paBtn("heart", "pa-like", fmtShort(d.likes));
  var cmt = paBtn("cmt", "", fmtShort(d.cmt));
  var rep = paBtn("repost", "", fmtShort(d.rep));
  var snd = paBtn("send", "", fmtShort(d.send));
  var sav = paBtn("save", "pa-save", null);

  if (d.mine && d.post) {
    /* 自分の投稿はフィードと同じ実データを触る */
    like.addEventListener("click", function () { toast("自分の投稿にいいねはできません"); });
    cmt.addEventListener("click", function () { openCommentSheet(d.post); });
    bumpCount(rep, d.rep, "リポストしました🔁");
    bumpCount(snd, d.send, "シェアしました✈");
  } else {
    bumpCount(like, d.likes, "いいねしました❤️");
    cmt.addEventListener("click", function () { toast("この投稿へのコメントは Coming soon 🚧"); });
    bumpCount(rep, d.rep, "リポストしました🔁");
    bumpCount(snd, d.send, "シェアしました✈");
  }
  sav.addEventListener("click", function () {
    sav.classList.toggle("saved");
    toast(sav.classList.contains("saved") ? "保存しました🔖" : "保存を取り消しました");
  });

  var sp = document.createElement("span");
  sp.className = "spacer";
  row.appendChild(like); row.appendChild(cmt); row.appendChild(rep); row.appendChild(snd);
  row.appendChild(sp); row.appendChild(sav);
  return row;
}
