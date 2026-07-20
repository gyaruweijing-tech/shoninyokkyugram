/* explore.js — 検索/発見タブ（グリッド・動画の自動再生制御・検索サジェスト）
   読み込み順: … → views.js → explore.js → main.js

   自動再生の設計:
   - IntersectionObserver で「今見えているセル」を検知
   - 同時再生は EX_MAX_PLAY(=3) 本まで（本家と同じく、全部は再生しない）
   - 見える直前まで video.src を割り当てない（遅延読込。通信とメモリを節約）
   - 画面外に出たら pause して枠を解放 → 次のセルが再生される
   - 読み込み失敗時は poster(picsum) が残るのでグリッドは崩れない
*/
"use strict";

var EX_MAX_PLAY = 3;
var exPlaying = [];
var exBuilt = false;

/* 再生回数の表記（本家準拠: 9.4万 / 512万 / 1,295万 / 1.1億） */
function fmtViews(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, "") + "億";
  if (n >= 10000) {
    var man = n / 10000;
    return (man >= 100 ? fmt(Math.round(man)) : man.toFixed(1).replace(/\.0$/, "")) + "万";
  }
  return fmt(n);
}

var EX_PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

function exCell(item) {
  var cell = document.createElement("div");
  cell.className = "ex-cell";

  var poster = document.createElement("img");
  poster.className = "ex-poster";
  poster.alt = "";
  poster.loading = "lazy";
  poster.src = item.poster || kwImg(item.kw, 360, 480, hashLock(item.seed));
  if (!item.poster) imgFallback(poster, item.seed, 360, 480);
  cell.appendChild(poster);

  if (item.video) {
    cell.dataset.video = item.video;
    var v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "none";
    cell.appendChild(v);
  }

  if (item.text) {
    var t = document.createElement("div");
    t.className = "ex-text";
    t.textContent = item.text;
    cell.appendChild(t);
  }
  if (item.badge) {
    var b = document.createElement("div");
    b.className = "ex-badge";
    b.textContent = item.badge;
    cell.appendChild(b);
  }

  var views = document.createElement("div");
  views.className = "ex-views";
  views.innerHTML = EX_PLAY_ICON + "<span></span>";
  views.querySelector("span").textContent = fmtViews(item.views);
  cell.appendChild(views);

  cell.addEventListener("click", function () {
    if (item.mine) {
      switchView("home");
      var el = document.querySelector('[data-id="' + item.postId + '"]');
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      toast("この投稿は Coming soon 🚧");
    }
  });
  return cell;
}

/* 自分の投稿を先頭に「人気投稿」として差し込む（承認欲求パート） */
function exItems() {
  var list = DB.EXPLORE_ITEMS.slice();
  if (posts.length) {
    var mine = posts[0];
    var base = mine.likesTarget || mine.likesShown || 5000;
    list.unshift({
      poster: mine.url,
      views: Math.round(base * (9 + Math.random() * 5)), // 再生数はいいねより多い
      badge: "🔥 人気投稿",
      mine: true,
      postId: mine.id,
      seed: "mine"
    });
  }
  return list;
}

function renderExplore() {
  var grid = $("exploreGrid");
  grid.innerHTML = "";
  exPlaying = [];
  exItems().forEach(function (item) {
    var cell = exCell(item);
    if (item.mine) cell.classList.add("ex-mine");
    grid.appendChild(cell);
  });
  exObserve();
  exBuilt = true;
}

/* ===== 自動再生の制御 =====
   可視判定は矩形ベース（getBoundingClientRect）。
   IntersectionObserverは環境によって発火しないことがあるため、
   どこでも確実に動く方式を採用し、スクロールはrAFで間引く。 */
function exVisibleActive() {
  return document.getElementById("view-search").classList.contains("active");
}
function exComputeVisible() {
  var vh = window.innerHeight || document.documentElement.clientHeight;
  document.querySelectorAll("#exploreGrid .ex-cell[data-video]").forEach(function (c) {
    var r = c.getBoundingClientRect();
    // セルの半分以上が画面内に入っていれば「見えている」とみなす
    var shown = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    c._exVisible = r.height > 0 && shown >= r.height * 0.5;
  });
  exSync();
}
var exTick = false;
function exOnScroll() {
  if (exTick || !exVisibleActive()) return;
  exTick = true;
  requestAnimationFrame(function () {
    exTick = false;
    exComputeVisible();
  });
}
function exObserve() {
  exComputeVisible();
  setTimeout(function () { if (exVisibleActive()) exComputeVisible(); }, 300); // 画像レイアウト確定後にもう一度
}

function exSync() {
  // 画面外に出たものを止めて枠を空ける
  exPlaying = exPlaying.filter(function (c) {
    if (!c._exVisible) { exStop(c); return false; }
    return true;
  });
  if (exPlaying.length >= EX_MAX_PLAY) return;
  var cands = [].slice.call(document.querySelectorAll("#exploreGrid .ex-cell[data-video]"))
    .filter(function (c) { return c._exVisible && exPlaying.indexOf(c) < 0 && !c.classList.contains("ex-novideo"); });
  for (var i = 0; i < cands.length && exPlaying.length < EX_MAX_PLAY; i++) {
    exPlay(cands[i]);
    exPlaying.push(cands[i]);
  }
}

function exPlay(cell) {
  var v = cell.querySelector("video");
  if (!v) return;
  if (!v.src) {
    v.src = cell.dataset.video; // ここで初めて読み込む
    v.addEventListener("loadeddata", function () {
      // 同じ素材を使い回しても違って見えるよう、開始位置をずらす
      try {
        var d = v.duration || 0;
        if (d > 3) v.currentTime = Math.random() * (d - 2);
      } catch (e) {}
    }, { once: true });
    v.addEventListener("error", function () {
      cell.classList.add("ex-novideo"); // 静止画にフォールバック
      exRelease(cell);
    }, { once: true });
  }
  var p = v.play();
  if (p && p.catch) {
    p.catch(function () { cell.classList.add("ex-novideo"); exRelease(cell); });
  }
  cell.classList.add("ex-playing");
}

function exStop(cell) {
  var v = cell.querySelector("video");
  if (v) { try { v.pause(); } catch (e) {} }
  cell.classList.remove("ex-playing");
}
function exRelease(cell) {
  var i = exPlaying.indexOf(cell);
  if (i >= 0) exPlaying.splice(i, 1);
  exStop(cell);
  exSync();
}
/* タブを離れる時は全部止める（無駄な再生を残さない） */
function exPauseAll() {
  exPlaying.forEach(exStop);
  exPlaying = [];
}

/* ===== 検索サジェスト（有名人あるある） ===== */
function exRenderSuggest() {
  var wrap = $("exSuggest");
  var nm = profile.name || HANDLE;
  wrap.innerHTML = "";

  var head = document.createElement("div");
  head.className = "ex-sg-head";
  head.textContent = "最近の検索";
  wrap.appendChild(head);

  // 自分自身（本人アカウント）
  var me = document.createElement("div");
  me.className = "ex-sg-row";
  me.appendChild(myAvatarEl());
  var mb = document.createElement("div");
  var mn = document.createElement("div");
  mn.className = "ex-sg-main";
  mn.textContent = HANDLE;
  mn.insertAdjacentHTML("beforeend", VBADGE);
  var ms = document.createElement("div");
  ms.className = "ex-sg-sub";
  ms.textContent = (profile.name ? profile.name + " ・ " : "") + "フォロワー" + fmtShort(followers) + "人";
  mb.appendChild(mn);
  mb.appendChild(ms);
  me.appendChild(mb);
  me.addEventListener("click", function () { switchView("profile"); });
  wrap.appendChild(me);

  var head2 = document.createElement("div");
  head2.className = "ex-sg-head";
  head2.textContent = "急上昇ワード";
  wrap.appendChild(head2);

  DB.SEARCH_SUFFIXES.forEach(function (sfx) {
    var row = document.createElement("div");
    row.className = "ex-sg-row";
    var ic = document.createElement("div");
    ic.className = "ex-sg-ic";
    ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    row.appendChild(ic);
    var b = document.createElement("div");
    var main = document.createElement("div");
    main.className = "ex-sg-main";
    main.textContent = nm + " " + sfx;
    var sub = document.createElement("div");
    sub.className = "ex-sg-sub";
    sub.textContent = fmt(rand(12000, 480000)) + "件の検索";
    b.appendChild(main);
    b.appendChild(sub);
    row.appendChild(b);
    row.addEventListener("click", function () {
      $("exSearchInput").value = nm + " " + sfx;
      toast("検索結果は Coming soon 🚧");
    });
    wrap.appendChild(row);
  });
}
