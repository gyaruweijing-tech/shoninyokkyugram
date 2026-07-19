/* core.js — 共通ユーティリティ・状態・IndexedDB・画像処理
   読み込み順: comments-db.js → core.js → stories.js → feed.js → views.js → main.js
   （全ファイルがグローバルスコープを共有する。ビルドなし方針） */
"use strict";

var DB = window.KUSO_DB;
var BRAND = "Shoninyokkyugram";       // 表示名（承認欲求グラム）
var HANDLE = "watashi__official";     // 自分のアカウント名（プロフィールで上書き）

/* ================= util ================= */
function $(id) { return document.getElementById(id); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(n) { return n.toLocaleString("ja-JP"); }
function fmtShort(n) {
  if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1) + "万";
  return fmt(n);
}

var toastTimer;
function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

function banner(icon, title, body) {
  $("notifIcon").textContent = icon;
  $("notifTitle").textContent = title;
  $("notifBody").textContent = body;
  var n = $("notifBanner");
  n.classList.add("show");
  setTimeout(function () { n.classList.remove("show"); }, 4200);
}

function avatarColor(name) {
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return DB.AVATAR_COLORS[h % DB.AVATAR_COLORS.length];
}
function avatarEl(name, cls) {
  var d = document.createElement("div");
  d.className = "avatar" + (cls ? " " + cls : "");
  d.style.background = avatarColor(name);
  d.textContent = (name[0] || "?").toUpperCase();
  return d;
}
var VBADGE = '<svg class="vbadge" viewBox="0 0 24 24" fill="#0095f6"><path d="M12 2l2.4 2.4 3.3-.5.5 3.3L20.6 9 22 12l-1.4 3-2.4 1.8-.5 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.5-3.3L3.4 15 2 12l1.4-3 2.4-1.8.5-3.3 3.3.5z"/><path d="M9.5 12.2l1.8 1.8 3.4-3.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function timeAgo(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "たった今";
  if (s < 3600) return Math.floor(s / 60) + "分前";
  if (s < 86400) return Math.floor(s / 3600) + "時間前";
  return Math.floor(s / 86400) + "日前";
}

/* ================= IndexedDB ================= */
var idb;
function openDb() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open("kuso-instagram", 2);
    req.onupgradeneeded = function () {
      var d = req.result;
      if (!d.objectStoreNames.contains("posts")) d.createObjectStore("posts", { keyPath: "id" });
      if (!d.objectStoreNames.contains("stories")) d.createObjectStore("stories", { keyPath: "id" });
    };
    req.onblocked = function () {
      // 旧バージョンのDBを開いている別タブがあるとアップグレードが進めない
      toast("他のタブでこのアプリが開いています。閉じてからリロードしてください");
    };
    req.onsuccess = function () {
      idb = req.result;
      // 将来のアップグレードをこのタブがブロックしないように
      idb.onversionchange = function () { idb.close(); };
      resolve();
    };
    req.onerror = function () { reject(req.error); };
  });
}
function dbPutIn(store, obj) {
  return new Promise(function (resolve, reject) {
    var tx = idb.transaction(store, "readwrite");
    tx.objectStore(store).put(obj);
    tx.oncomplete = resolve;
    tx.onerror = function () { reject(tx.error); };
  });
}
function dbAllFrom(store) {
  return new Promise(function (resolve, reject) {
    var tx = idb.transaction(store, "readonly");
    var req = tx.objectStore(store).getAll();
    req.onsuccess = function () { resolve(req.result || []); };
    req.onerror = function () { reject(req.error); };
  });
}
function dbDeleteFrom(store, id) {
  return new Promise(function (resolve) {
    var tx = idb.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}
function dbPut(post) { return dbPutIn("posts", post); }
function dbAll() { return dbAllFrom("posts"); }

/* ================= state ================= */
var LS = {
  get: function (k, def) {
    try { var v = localStorage.getItem("kuso." + k); return v === null ? def : JSON.parse(v); }
    catch (e) { return def; }
  },
  set: function (k, v) { try { localStorage.setItem("kuso." + k, JSON.stringify(v)); } catch (e) {} }
};
var followers = LS.get("followers", 184000 + rand(0, 9000));
var dms = LS.get("dms", []);
var unreadDms = LS.get("unreadDms", 0);
var unreadNotifs = LS.get("unreadNotifs", 0);
var posts = []; // {id, blob, url, caption, likesTarget, likesShown, comments, time, buzz, myLike}
var myStories = []; // {id, blob, url, text, time, base, rate, cap}

/* プロフィール（編集可能） */
var profile = LS.get("profile", {
  handle: "watashi__official",
  bio1: "インフルエンサー / 何もしてないのに有名",
  bio2: "お仕事のご依頼はDMへ",
  avatar: null // dataURL（端末内のみ）
});
HANDLE = profile.handle;

/* 自分のアバター（画像設定済みなら画像、なければイニシャル丸） */
function myAvatarEl(cls) {
  var d = document.createElement("div");
  d.className = "avatar" + (cls ? " " + cls : "");
  if (profile.avatar) {
    d.style.background = "transparent";
    var img = document.createElement("img");
    img.className = "face-img";
    img.alt = "";
    img.src = profile.avatar;
    d.appendChild(img);
  } else {
    d.style.background = avatarColor(HANDLE);
    d.textContent = (HANDLE[0] || "?").toUpperCase();
  }
  return d;
}
function renderNavAvatar() {
  var nav = $("navAvatar");
  nav.innerHTML = "";
  nav.style.background = profile.avatar ? "transparent" : avatarColor(HANDLE);
  if (profile.avatar) {
    var img = document.createElement("img");
    img.className = "face-img";
    img.src = profile.avatar;
    nav.appendChild(img);
  } else {
    nav.textContent = (HANDLE[0] || "?").toUpperCase();
  }
}

/* ================= image utils ================= */
function fileToResizedBlob(file, maxSize, quality) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var w = img.width, h = img.height;
      var scale = Math.min(1, maxSize / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.round(w * scale);
      cv.height = Math.round(h * scale);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error("toBlob failed"));
      }, "image/jpeg", quality);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}
function blobToResizedBase64(blob, maxSize, quality) {
  return fileToResizedBlob(blob, maxSize, quality).then(function (small) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        var idx = s.indexOf(",");
        resolve({ mime: "image/jpeg", data: s.slice(idx + 1) });
      };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsDataURL(small);
    });
  });
}
