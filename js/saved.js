/* saved.js — 保存済み（コレクション／シリーズ／リール／投稿／オーディオ）本家完コピ
   読み込み順: … → reels.js → settings.js → saved.js → main.js */
"use strict";

var SAVED_TABS = ["すべて", "コレクション", "シリーズ", "リール", "投稿", "オーディオ"];
var savedTab = "すべて";
var savedReturnView = "settings"; // どこから開いたか（戻る先）

var SAV_LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
var SAV_PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
var SAV_MULTI_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="8" y="3" width="13" height="13" rx="2.5"/><path d="M3 8v11a2.5 2.5 0 0 0 2.5 2.5H16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
var SAV_SERIES_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="14" height="14" rx="3"/><path d="M3 8v10a3 3 0 0 0 3 3h10"/><path d="m12 8 4 2.5-4 2.5z" fill="currentColor" stroke="none"/></svg>';
var SAV_AUDIO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>';

/* 設定/プロフィールメニューから開く */
function openSaved(from) {
  savedTab = "すべて";
  savedReturnView = from || "settings";
  switchView("saved");
}

function renderSavedChips() {
  var wrap = $("savedChips");
  wrap.innerHTML = "";
  SAVED_TABS.forEach(function (t) {
    var b = document.createElement("button");
    b.className = "sav-chip" + (t === savedTab ? " active" : "");
    b.textContent = t;
    b.addEventListener("click", function () { savedTab = t; renderSaved(); });
    wrap.appendChild(b);
  });
}

function savCellImg(item, w, h) {
  var img = document.createElement("img");
  img.alt = "";
  img.loading = "lazy";
  img.src = kwImg(item.kw, w, h, hashLock(item.seed));
  imgFallback(img, item.seed, w, h);
  return img;
}

function savSecHead(title, linkText, onClick) {
  var h = document.createElement("div");
  h.className = "sav-sechead";
  var b = document.createElement("b");
  b.textContent = title;
  h.appendChild(b);
  var a = document.createElement("button");
  a.className = "sav-seclink";
  a.textContent = linkText;
  a.addEventListener("click", onClick);
  h.appendChild(a);
  return h;
}

/* すべてタブのコレクション・ミニ行 */
function savMini(c) {
  var row = document.createElement("div");
  row.className = "sav-mini";
  var cover = document.createElement("img");
  cover.className = "sav-mini-cover";
  cover.alt = "";
  cover.loading = "lazy";
  var kw = c.music ? c.covers[0] : c.kw;
  var seed = c.music ? c.name : c.seed;
  cover.src = kwImg(kw, 160, 160, hashLock(seed));
  imgFallback(cover, seed, 160, 160);
  row.appendChild(cover);
  var body = document.createElement("div");
  body.className = "sav-mini-body";
  var nm = document.createElement("div");
  nm.className = "sav-mini-name";
  nm.textContent = c.name;
  body.appendChild(nm);
  if (c.priv) {
    var pv = document.createElement("div");
    pv.className = "sav-mini-priv";
    pv.innerHTML = SAV_LOCK_SVG + "<span>プライベート</span>";
    body.appendChild(pv);
  }
  row.appendChild(body);
  row.addEventListener("click", function () { toast(c.name + "は Coming soon 🚧"); });
  return row;
}

/* すべてタブ */
function renderSavedAll(body) {
  body.appendChild(savSecHead("コレクション", "すべて見る", function () {
    savedTab = "コレクション"; renderSaved();
  }));
  var mini = document.createElement("div");
  mini.className = "sav-mini-grid";
  DB.SAVED_COLLECTIONS.forEach(function (c) { mini.appendChild(savMini(c)); });
  body.appendChild(mini);

  body.appendChild(savSecHead("リール動画と投稿", "管理", function () {
    toast("コレクションの管理は Coming soon 🚧");
  }));
  var g = document.createElement("div");
  g.className = "sav-grid";
  DB.SAVED_REELS.forEach(function (it) {
    var cell = document.createElement("div");
    cell.className = "sav-cell reel";
    cell.appendChild(savCellImg(it, 300, 400));
    var p = document.createElement("span");
    p.className = "pf-multi";
    p.innerHTML = SAV_PLAY_SVG;
    cell.appendChild(p);
    cell.addEventListener("click", function () { toast("保存した投稿は Coming soon 🚧"); });
    g.appendChild(cell);
  });
  body.appendChild(g);
}

/* コレクションタブ（大カード） */
function renderSavedCollections(body) {
  var g = document.createElement("div");
  g.className = "sav-coll-grid";
  DB.SAVED_COLLECTIONS.forEach(function (c) {
    var card = document.createElement("div");
    card.className = "sav-coll-card";
    if (c.music) {
      var quad = document.createElement("div");
      quad.className = "sav-coll-quad";
      c.covers.forEach(function (cv, i) {
        var im = document.createElement("img");
        im.alt = ""; im.loading = "lazy";
        im.src = kwImg(cv, 200, 200, hashLock(c.name + i));
        imgFallback(im, c.name + i, 200, 200);
        quad.appendChild(im);
      });
      for (var k = c.covers.length; k < 4; k++) {
        var e = document.createElement("div");
        e.className = "empty";
        quad.appendChild(e);
      }
      card.appendChild(quad);
    } else {
      var cover = document.createElement("img");
      cover.className = "sav-coll-cover";
      cover.alt = ""; cover.loading = "lazy";
      cover.src = kwImg(c.kw, 400, 400, hashLock(c.seed));
      imgFallback(cover, c.seed, 400, 400);
      card.appendChild(cover);
    }
    var nm = document.createElement("div");
    nm.className = "sav-coll-name";
    nm.textContent = (c.music ? "♫ " : "") + c.name;
    card.appendChild(nm);
    card.addEventListener("click", function () { toast(c.name + "は Coming soon 🚧"); });
    g.appendChild(card);
  });
  body.appendChild(g);
}

/* リール／投稿タブ（3列グリッド） */
function renderSavedGrid(body, items, kind) {
  var g = document.createElement("div");
  g.className = "sav-grid";
  items.forEach(function (it) {
    var cell = document.createElement("div");
    cell.className = "sav-cell " + (kind === "post" ? "post" : "reel");
    cell.appendChild(savCellImg(it, kind === "post" ? 300 : 300, kind === "post" ? 300 : 400));
    if (kind === "reel") {
      var v = document.createElement("div");
      v.className = "ex-views";
      v.innerHTML = SAV_PLAY_SVG + "<span></span>";
      v.querySelector("span").textContent = fmtViews(it.views);
      cell.appendChild(v);
    } else if (kind === "post" && it.multi) {
      var m = document.createElement("span");
      m.className = "pf-multi";
      m.innerHTML = SAV_MULTI_SVG;
      cell.appendChild(m);
    }
    cell.addEventListener("click", function () {
      toast("保存した" + (kind === "post" ? "投稿" : "リール") + "は Coming soon 🚧");
    });
    g.appendChild(cell);
  });
  body.appendChild(g);
}

/* 空状態（シリーズ／オーディオ） */
function renderSavedEmpty(body, icon, title, sub) {
  var e = document.createElement("div");
  e.className = "sav-empty";
  e.innerHTML = '<div class="sav-empty-ic">' + icon + '</div><b></b><p></p>';
  e.querySelector("b").textContent = title;
  e.querySelector("p").textContent = sub;
  body.appendChild(e);
}

function renderSaved() {
  renderSavedChips();
  var body = $("savedBody");
  body.innerHTML = "";
  if (savedTab === "すべて") renderSavedAll(body);
  else if (savedTab === "コレクション") renderSavedCollections(body);
  else if (savedTab === "リール") renderSavedGrid(body, DB.SAVED_REELS, "reel");
  else if (savedTab === "投稿") renderSavedGrid(body, DB.SAVED_POSTS, "post");
  else if (savedTab === "シリーズ") renderSavedEmpty(body, SAV_SERIES_SVG, "保存したシリーズ", "シリーズを保存すると、ここに表示されます。");
  else renderSavedEmpty(body, SAV_AUDIO_SVG, "保存したオーディオ", "オーディオを保存すると、ここに表示されます。");
}
