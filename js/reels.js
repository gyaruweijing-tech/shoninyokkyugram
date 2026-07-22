/* reels.js — リールタブ（全画面縦スワイプ・1本だけ再生）
   読み込み順: … → explore.js → reels.js → main.js

   動画ソースの優先順位:
   1. assets/videos/reelN.mp4（本人の自作動画。置くだけで自動採用）
   2. 読み込めなければ Pexels のフリー素材にフォールバック
   3. それも駄目ならグラデ背景（.rl-fallback）
   → 何本置いても、置かなくても成立する
*/
"use strict";

var RL_LOCAL_DIR = "assets/videos/";
var rlPlaying = null;
var rlTick = false;

function rlLocalSrc(i) { return RL_LOCAL_DIR + "reel" + (i + 1) + ".mp4"; }

var RL_ICONS = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>',
  repost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 12V10a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>'
};

function rlActBtn(iconKey, count, onClick) {
  var b = document.createElement("button");
  b.className = "rl-act";
  b.innerHTML = RL_ICONS[iconKey] + "<span></span>";
  var span = b.querySelector("span");
  span.textContent = fmt(count);
  b.addEventListener("click", function () { onClick(b, span); });
  return b;
}

function rlItem(item, idx) {
  var el = document.createElement("div");
  el.className = "rl-item";

  el.appendChild(Object.assign(document.createElement("div"), { className: "rl-fallback" }));

  var v = document.createElement("video");
  v.className = "rl-video";
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.preload = "none";
  el.dataset.local = rlLocalSrc(idx);
  el.dataset.fallback = item.fallback;
  el.appendChild(v);

  /* 右の縦アクション列 */
  var rail = document.createElement("div");
  rail.className = "rl-rail";
  var state = { liked: false, n: item.likes };
  var likeBtn = rlActBtn("heart", item.likes, function (b, span) {
    state.liked = !state.liked;
    b.classList.toggle("liked", state.liked);
    state.n += state.liked ? 1 : -1;
    span.textContent = fmt(state.n);
    if (state.liked) flyHearts(b, 3);
  });
  rail.appendChild(likeBtn);
  rail.appendChild(rlActBtn("comment", item.cmt, function () { toast("コメントは Coming soon 🚧"); }));
  rail.appendChild(rlActBtn("repost", item.rep, function () { toast("リポストは Coming soon 🚧"); }));
  rail.appendChild(rlActBtn("send", item.send, function () { toast("送信は Coming soon 🚧"); }));
  var more = document.createElement("button");
  more.className = "rl-act";
  more.innerHTML = RL_ICONS.more;
  more.addEventListener("click", function () { toast("Coming soon 🚧"); });
  rail.appendChild(more);
  var disc = document.createElement("div");
  disc.className = "rl-disc";
  var di = document.createElement("img");
  di.alt = "";
  di.src = "https://picsum.photos/seed/rl-" + idx + "/60/60";
  disc.appendChild(di);
  rail.appendChild(disc);
  el.appendChild(rail);

  /* 左下の情報ブロック */
  var info = document.createElement("div");
  info.className = "rl-info";

  var userRow = document.createElement("div");
  userRow.className = "rl-user";
  var ring = document.createElement("div");
  ring.className = "rl-ring";
  ring.appendChild(linkToUser(avatarEl(item.user), item.user));
  userRow.appendChild(ring);
  var un = document.createElement("span");
  un.className = "rl-uname";
  un.textContent = item.user;
  if (item.verified) un.insertAdjacentHTML("beforeend", VBADGE);
  userRow.appendChild(linkToUser(un, item.user));
  var fb = document.createElement("button");
  fb.className = "rl-follow";
  fb.textContent = "フォロー";
  fb.addEventListener("click", function () {
    var done = fb.classList.toggle("done");
    fb.textContent = done ? "フォロー中" : "フォロー";
  });
  userRow.appendChild(fb);
  info.appendChild(userRow);

  var audio = document.createElement("div");
  audio.className = "rl-audio";
  audio.innerHTML = RL_ICONS.audio + " <span></span>";
  audio.querySelector("svg").style.cssText = "width:13px;height:13px;vertical-align:-1px";
  audio.querySelector("span").textContent = item.audio;
  info.appendChild(audio);

  var cap = document.createElement("div");
  cap.className = "rl-caption";
  cap.textContent = item.caption;
  info.appendChild(cap);

  var fol = document.createElement("div");
  fol.className = "rl-followers";
  var av1 = avatarEl(item.user + "a"), av2 = avatarEl(item.user + "b");
  fol.appendChild(av1);
  fol.appendChild(av2);
  var ftx = document.createElement("span");
  ftx.textContent = "フォロワー: " + makeName(pick(DB.PERSONAS[weightedPersona()].names)) + "さん、他" + rand(3, 24) + "人";
  fol.appendChild(ftx);
  info.appendChild(fol);

  el.appendChild(info);

  // 画面タップで再生/一時停止
  el.addEventListener("click", function (e) {
    if (e.target.closest(".rl-rail") || e.target.closest(".rl-info")) return;
    if (v.paused) { v.play().catch(function () {}); } else { v.pause(); }
  });
  return el;
}

function renderReels() {
  var feed = $("reelsFeed");
  feed.innerHTML = "";
  rlPlaying = null;
  DB.REEL_ITEMS.forEach(function (item, i) {
    feed.appendChild(rlItem(item, i));
  });
  // 上部「友達」のアバター重ね
  var avs = $("rlFriendAvs");
  avs.innerHTML = "";
  ["a", "b", "c"].forEach(function (s) { avs.appendChild(avatarEl(s + "friend")); });
  rlSync();
}

/* 見えている1本だけ再生する */
function rlSync() {
  var feed = $("reelsFeed");
  if (!feed) return;
  var fr = feed.getBoundingClientRect();
  var best = null, bestOverlap = 0;
  [].slice.call(feed.children).forEach(function (el) {
    var r = el.getBoundingClientRect();
    var overlap = Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top);
    if (overlap > bestOverlap) { bestOverlap = overlap; best = el; }
  });
  if (!best || bestOverlap < fr.height * 0.5) return;
  if (rlPlaying === best) return;
  if (rlPlaying) rlStop(rlPlaying);
  rlPlay(best);
  rlPlaying = best;
}

function rlPlay(el) {
  var v = el.querySelector("video");
  if (!v) return;
  if (!v.src) {
    // まず自作動画、駄目ならフリー素材
    v.src = el.dataset.local;
    v.addEventListener("error", function onErr() {
      v.removeEventListener("error", onErr);
      if (v.src.indexOf(RL_LOCAL_DIR) >= 0 && el.dataset.fallback) {
        v.src = el.dataset.fallback; // フォールバック
        v.play().catch(function () {});
      }
    });
  }
  var p = v.play();
  if (p && p.catch) p.catch(function () {});
}
function rlStop(el) {
  var v = el.querySelector("video");
  if (v) { try { v.pause(); } catch (e) {} }
}
function rlPauseAll() {
  var feed = $("reelsFeed");
  if (!feed) return;
  [].slice.call(feed.children).forEach(rlStop);
  rlPlaying = null;
}
function rlOnScroll() {
  if (rlTick) return;
  rlTick = true;
  requestAnimationFrame(function () { rlTick = false; rlSync(); });
}
