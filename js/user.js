/* user.js — 他人のプロフィール画面（本家スクショ2枚を完コピ）
   読み込み順: … → settings.js → user.js → main.js

   設計の要: このアプリにはユーザーネームが「ただの文字列」として散らばっている
   （偽アカ・VIP・コメント主・シード投稿・リール・広告…）。
   そのどれをタップしても開けるように、DB.USER_PROFILES に無いアカウントは
   ユーザーネームのハッシュから決定的に生成する。
   決定的なので、同じ人を何度開いても数字も画像も変わらない。 */
"use strict";

/* ---- ユーザーネーム → 決定的な乱数 ---- */
function uSeed(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function uRng(seed) {
  var x = seed || 1;
  return function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 4294967296;
  };
}
function uInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function uPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/* ---- 既存データからアイコン・認証バッジを拾う（データを二重に持たないため） ---- */
function knownIcon(handle) {
  var hit = null;
  DB.SEED_POSTS.forEach(function (p) { if (p.user === handle) hit = { icon: p.icon, verified: p.verified }; });
  DB.STORY_ACCOUNTS.forEach(function (a) { if (a.user === handle && !hit) hit = { icon: a.icon, verified: false }; });
  DB.AD_POSTS.forEach(function (a) { if (a.user === handle && !hit) hit = { icon: a.icon, verified: false }; });
  DB.DISCOVER_ACCOUNTS.forEach(function (a) { if (a.user === handle && !hit) hit = { icon: a.icon, verified: false }; });
  DB.REEL_ITEMS.forEach(function (r) { if (r.user === handle && !hit) hit = { icon: null, verified: r.verified }; });
  return hit;
}

/* ---- アカウント情報の解決（手書き優先 → 無ければ生成） ---- */
var userCache = {};
function userAccount(handle) {
  if (userCache[handle]) return userCache[handle];

  var rng = uRng(uSeed(handle));
  var known = knownIcon(handle) || {};
  var hand = DB.USER_PROFILES[handle];
  var a;

  if (hand) {
    a = {
      handle: handle, name: hand.name, verified: hand.verified,
      posts: hand.posts, followers: hand.followers, following: hand.following,
      bio: hand.bio.slice(), link: hand.link, threads: hand.threads,
      highlights: hand.highlights.slice(), kw: hand.kw
    };
  } else {
    /* 生成アカウント。フォロワーは「ほとんどが小規模、たまに人気」の分布にする */
    var tier = rng();
    var fw = tier > 0.93 ? uInt(rng, 40000, 320000)
           : tier > 0.72 ? uInt(rng, 3000, 39000)
           : uInt(rng, 120, 2900);
    var bio = [uPick(rng, DB.USER_BIO_POOL)];
    if (rng() > 0.45) bio.push(uPick(rng, DB.USER_BIO_POOL));
    if (rng() > 0.8) bio.push(uPick(rng, DB.USER_BIO_POOL));
    var hls = [];
    if (rng() > 0.5) {
      var n = uInt(rng, 2, 5);
      DB.USER_HL_POOL.forEach(function (h) { if (hls.length < n && rng() > 0.35) hls.push(h); });
    }
    a = {
      handle: handle,
      name: uPick(rng, DB.USER_NAME_POOL),
      verified: known.verified || fw > 150000,
      posts: uInt(rng, 12, 1600),
      followers: fw,
      following: uInt(rng, 80, 2200),
      bio: bio,
      link: rng() > 0.7 ? uPick(rng, DB.USER_LINK_POOL) + handle.replace(/[^a-z0-9_]/gi, "").slice(0, 12) : null,
      threads: rng() > 0.65,
      highlights: hls,
      kw: null
    };
  }

  a.icon = known.icon || "https://i.pravatar.cc/150?img=" + uInt(rng, 1, 70);
  a.grid = userGrid(handle, a);
  userCache[handle] = a;
  return a;
}

/* ---- グリッドのセルを決定的に組む（ピン留め・リール・複数枚・閲覧済み） ---- */
function userGrid(handle, a) {
  var rng = uRng(uSeed(handle + "#grid"));
  var kws = uPick(rng, DB.USER_GRID_KW).slice();
  /* 手書きキャラは代表キーワードを先頭に混ぜて世界観を寄せる */
  if (a.kw) kws.unshift(a.kw, a.kw);
  var pins = uInt(rng, 0, 3);
  var cells = [];
  for (var i = 0; i < 18; i++) {
    var kind = rng();
    cells.push({
      kw: kws[i % kws.length],
      lock: (uSeed(handle + i) % 900) + 1,
      pinned: i < pins,
      reel: kind > 0.62,
      multi: kind > 0.42 && kind <= 0.62,
      seen: kind > 0.62 && rng() > 0.72   // リールだけ「閲覧済み」が付く
    });
  }
  return cells;
}

/* ================= 描画 ================= */
var upCurrent = null;      // いま開いているアカウント
var upTab = "grid";
var upBackStack = [];      // どこから来たか（他人→他人と辿れるので配列で持つ）
var upFollowing = LS.get("upFollowing", []);   // 自分がフォローした他人（端末内に保存）

var UP_ICONS = {
  pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.5 21 9l-2.6 1-1.4 4.3-3-3L8.6 16 8 20l-1.5-1.5L4 21l1-3.5L3 16l4-.6 4.7-5.4-3-3L13 5.6z"/></svg>',
  reel: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  multi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="3" width="13" height="13" rx="2.5" fill="currentColor" stroke="none"/><path d="M16 19.5H5.5A1.5 1.5 0 0 1 4 18V7.5" stroke-linecap="round"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>',
  threads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8.5c-1-1.7-2.5-2.4-4.2-2.4-3.2 0-5.3 2.4-5.3 5.9s2 5.9 5.2 5.9c2.6 0 4.2-1.4 4.2-3.1 0-1.6-1.3-2.6-3.3-2.6-1.5 0-2.5.7-2.5 1.7 0 .8.6 1.3 1.5 1.3 1.1 0 1.8-.8 1.8-2.2"/></svg>'
};

/* アイコン画像の丸（読めなければイニシャル丸にフォールバック） */
function userAvatarEl(a, cls) {
  var d = avatarEl(a.handle, cls);
  if (!a.icon) return d;
  var img = document.createElement("img");
  img.className = "face-img";
  img.alt = "";
  img.src = a.icon;
  img.addEventListener("error", function () { img.remove(); });
  img.addEventListener("load", function () { d.textContent = ""; d.style.background = "transparent"; d.appendChild(img); });
  return d;
}

/* ユーザーネームやアバターをタップでプロフィールに飛ばす共通ヘルパー。
   アプリ中のどこにユーザーネームが出ていても、これを噛ませれば行き止まりにならない。 */
function linkToUser(el, handle) {
  if (!el || !handle) return el;
  el.style.cursor = "pointer";
  el.addEventListener("click", function (e) {
    e.stopPropagation();   // コメント行や通知行のクリックより優先する
    openUserProfile(handle);
  });
  return el;
}

function openUserProfile(handle) {
  if (!handle) return;
  /* 自分をタップした時は自分のプロフィールへ */
  if (handle === HANDLE || handle === profile.handle) { switchView("profile"); return; }

  var cur = document.querySelector(".view.active");
  var from = cur ? cur.id.replace("view-", "") : "home";
  /* 他人→他人と辿った時は、戻るで一人ずつ遡れるように積む */
  upBackStack.push(from === "user" ? { view: "user", handle: upCurrent && upCurrent.handle } : { view: from });

  upCurrent = userAccount(handle);
  upTab = "grid";
  renderUserProfile();
  switchView("user");
  window.scrollTo(0, 0);
}

function userBack() {
  var prev = upBackStack.pop();
  if (!prev) { switchView("home"); return; }
  if (prev.view === "user" && prev.handle) {
    upCurrent = userAccount(prev.handle);
    upTab = "grid";
    renderUserProfile();
    switchView("user");
    window.scrollTo(0, 0);
    return;
  }
  switchView(prev.view);
}

function renderUserProfile() {
  var a = upCurrent;
  if (!a) return;

  $("upHandle").textContent = a.handle;

  /* アバター（ストーリーを持っていて未読ならリング） */
  var avWrap = $("upAvatar");
  avWrap.innerHTML = "";
  avWrap.className = "up-av";
  var hasStory = DB.STORY_ACCOUNTS.some(function (s) { return s.user === a.handle; });
  if (hasStory && seenStories.indexOf(a.handle) < 0) avWrap.classList.add("ring");
  avWrap.appendChild(userAvatarEl(a));
  if (hasStory) {
    avWrap.style.cursor = "pointer";
    avWrap.onclick = function () {
      var idx = -1;
      DB.STORY_ACCOUNTS.forEach(function (s, i) { if (s.user === a.handle) idx = i; });
      if (idx >= 0) openStory(idx);
    };
  } else { avWrap.style.cursor = ""; avWrap.onclick = null; }

  /* 名前（＋認証バッジ） */
  var nm = $("upName");
  nm.innerHTML = "";
  nm.appendChild(document.createTextNode(a.name));
  if (a.verified) nm.insertAdjacentHTML("beforeend", VBADGE);

  /* 投稿 / フォロワー / フォロー中 */
  var st = $("upStats");
  st.innerHTML = "";
  [["投稿", a.posts], ["フォロワー", a.followers], ["フォロー中", a.following]].forEach(function (pair) {
    var d = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = fmt(pair[1]);
    var s = document.createElement("span");
    s.textContent = pair[0];
    d.appendChild(b); d.appendChild(s);
    st.appendChild(d);
  });

  /* 自己紹介（複数行）＋リンク＋Threadsバッジ */
  var bio = $("upBio");
  bio.innerHTML = "";
  a.bio.forEach(function (line) {
    var p = document.createElement("p");
    p.className = "up-bio-line";
    p.textContent = line;
    bio.appendChild(p);
  });
  if (a.link) {
    var lk = document.createElement("div");
    lk.className = "up-link";
    lk.innerHTML = UP_ICONS.link;
    lk.appendChild(document.createTextNode(a.link));
    lk.addEventListener("click", function () { toast("外部リンクは開けません（偽インスタなので）"); });
    bio.appendChild(lk);
  }
  if (a.threads) {
    var th = document.createElement("div");
    th.className = "up-threads";
    th.innerHTML = UP_ICONS.threads;
    th.appendChild(document.createTextNode(a.handle));
    th.addEventListener("click", function () { toast("Threadsは Coming soon 🚧"); });
    bio.appendChild(th);
  }

  renderUserMutual(a);
  renderUserButtons(a);
  renderUserHighlights(a);
  setUserTab("grid");
}

/* 「フォロワー: ◯◯、◯◯」＋重ねアバター（共通の知り合い風） */
function renderUserMutual(a) {
  var box = $("upMutual");
  var rng = uRng(uSeed(a.handle + "#mutual"));
  /* フォロワーが少なすぎる人には出さない（本家も共通の人がいる時だけ出る） */
  if (a.followers < 800) { box.hidden = true; return; }
  var pool = DB.FOLLOWER_VIPS.concat(DB.SUGGEST_ACCOUNTS);
  var n1 = uPick(rng, pool), n2 = uPick(rng, pool);
  if (n2 === n1) n2 = pool[(pool.indexOf(n1) + 3) % pool.length];

  box.hidden = false;
  box.innerHTML = "";
  var avs = document.createElement("div");
  avs.className = "up-mutual-avs";
  [n1, n2].forEach(function (n) { avs.appendChild(avatarEl(n)); });
  box.appendChild(avs);

  var txt = document.createElement("div");
  txt.appendChild(document.createTextNode("フォロワー: "));
  [n1, n2].forEach(function (n, i) {
    if (i) txt.appendChild(document.createTextNode("、"));
    var b = document.createElement("b");
    b.textContent = n;
    b.style.cursor = "pointer";
    b.addEventListener("click", function () { openUserProfile(n); });
    txt.appendChild(b);
  });
  box.appendChild(txt);
}

function renderUserButtons(a) {
  var btn = $("upFollowBtn");
  var on = upFollowing.indexOf(a.handle) >= 0;
  btn.textContent = on ? "フォロー中" : "フォロー";
  btn.classList.toggle("following", on);
}

function toggleUserFollow() {
  if (!upCurrent) return;
  var h = upCurrent.handle;
  var i = upFollowing.indexOf(h);
  if (i >= 0) upFollowing.splice(i, 1);
  else upFollowing.push(h);
  LS.set("upFollowing", upFollowing);
  renderUserButtons(upCurrent);
}

/* ハイライト（持っていない人は列ごと消える＝スクショ2枚目の状態） */
function renderUserHighlights(a) {
  var row = $("upHighlights");
  row.innerHTML = "";
  if (!a.highlights.length) { row.hidden = true; return; }
  row.hidden = false;
  a.highlights.forEach(function (label, i) {
    var item = document.createElement("div");
    item.className = "hl";
    var img = document.createElement("img");
    img.className = "hl-cover";
    img.alt = "";
    img.loading = "lazy";
    var lock = (uSeed(a.handle + label) % 900) + 1;
    img.src = kwImg(a.kw || "portrait,people", 200, 200, lock);
    imgFallback(img, "uhl-" + a.handle + i, 200, 200);
    var cap = document.createElement("div");
    cap.className = "hl-label";
    cap.textContent = label;
    item.appendChild(img);
    item.appendChild(cap);
    item.addEventListener("click", function () { openUserHighlight(a, label); });
    row.appendChild(item);
  });
}

/* ================= プロフィール上の3ボタン =================
   どれも既存のシートを使い回しているので index.html に新しい入れ物は足していない。
   （本家のお手本スクショが来たら、この中身を完コピに差し替える） */

/* メッセージ → その人とのDMを開く。無ければ作ってDM一覧に載せる（普通のDMと同じ扱い） */
function openUserDm(a) {
  var found = null;
  for (var i = 0; i < dms.length; i++) {
    if (dms[i].name === a.handle) { found = dms[i]; break; }
  }
  if (!found) {
    found = { name: a.handle, msg: "", time: Date.now(), person: true, thread: [] };
    dms.unshift(found);
    LS.set("dms", dms);
  }
  if (!found.thread) found.thread = found.msg ? [{ who: "them", text: found.msg }] : [];
  switchView("dm");
  openDmThread(found);
}

/* 👤+ → 「このアカウントに似ているおすすめ」。フォロワー一覧のシートを使い回す */
function openSimilarSheet(a) {
  $("followersTitle").textContent = "おすすめ";
  var list = $("followersList");
  list.innerHTML = "";
  var rng = uRng(uSeed(a.handle + "#similar"));
  var pool = DB.SUGGEST_ACCOUNTS.concat(DB.FOLLOWER_VIPS);
  var sub = a.handle + "さんをフォローしています";
  var seen = {}, added = 0, guard = 0;
  while (added < 12 && guard++ < 120) {
    var nm = added < 4 ? uPick(rng, pool) : makeName(pick(DB.PERSONAS[weightedPersona()].names));
    if (seen[nm] || nm === a.handle) continue;
    seen[nm] = 1;
    list.appendChild(followerRow(nm, false, sub));
    added++;
  }
  $("followersSheet").classList.add("open");
}

/* ··· メニュー → 投稿メニューと同じシートを使い回す */
var USER_MENU = [
  { ic: "🔗", label: "プロフィールのURLをコピー" },
  { ic: "↗", label: "このプロフィールをシェア" },
  { ic: "🔔", label: "お知らせを受け取る" },
  { ic: "⭐", label: "お気に入りに追加" },
  { ic: "🙈", label: "ミュート" },
  { ic: "🚫", label: "ブロック", danger: true },
  { ic: "⚠️", label: "報告する", danger: true }
];
function openUserMenu(a) {
  var list = $("postMenuList");
  list.innerHTML = "";
  USER_MENU.forEach(function (m) {
    var row = document.createElement("div");
    row.className = "pf-menu-item";
    if (m.danger) row.style.color = "#ed4956";
    var ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = m.ic;
    row.appendChild(ic);
    row.appendChild(document.createTextNode(m.label));
    row.addEventListener("click", function () {
      $("postMenuSheet").classList.remove("open");
      toast(m.label + "は Coming soon 🚧");
    });
    list.appendChild(row);
  });
  $("postMenuSheet").classList.add("open");
}

/* 他人のハイライト再生。自分のハイライトと同じストーリービューアを使い回す。
   中身は handle+label から決定的に作るので、同じハイライトは何度開いても同じ写真。 */
function openUserHighlight(a, label) {
  var kw = a.kw || "portrait,people,lifestyle";
  var n = (uSeed(a.handle + label) % 3) + 3; // 3〜5枚
  var stories = [];
  for (var i = 0; i < n; i++) {
    var lock = (uSeed(a.handle + label + "#" + i) % 900) + 1;
    stories.push({ url: kwImg(kw, 720, 1280, lock), text: "", timeStr: label });
  }
  svAccounts = [{ user: a.handle, icon: a.icon, stories: stories }];
  svAcc = 0;
  svSlide = 0;
  $("storyViewer").classList.add("open");
  svShow();
}

/* ---- タブ ---- */
function setUserTab(tab) {
  upTab = tab;
  [].forEach.call(document.querySelectorAll("#upTabs .pf-tab"), function (b) {
    b.classList.toggle("active", b.dataset.uptab === tab);
  });
  var grid = $("upGrid"), empty = $("upEmpty");
  var a = upCurrent;

  if (tab === "repost") {
    grid.hidden = true; empty.hidden = false;
    empty.textContent = a.handle + " さんはまだリポストしていません";
    return;
  }
  if (tab === "tagged") {
    grid.hidden = true; empty.hidden = false;
    empty.textContent = a.handle + " さんが写っている写真はまだありません";
    return;
  }

  var cells = tab === "reels" ? a.grid.filter(function (c) { return c.reel; }) : a.grid;
  if (!cells.length) {
    grid.hidden = true; empty.hidden = false;
    empty.textContent = "まだ投稿がありません";
    return;
  }
  empty.hidden = true; grid.hidden = false;
  renderUserGrid(cells);
}

function renderUserGrid(cells) {
  var g = $("upGrid");
  g.innerHTML = "";
  cells.forEach(function (c, i) {
    var cell = document.createElement("div");
    cell.className = "up-cell";
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = kwImg(c.kw, 300, 300, c.lock);
    imgFallback(img, "ug-" + upCurrent.handle + i, 300, 300);
    cell.appendChild(img);

    if (c.pinned) cell.insertAdjacentHTML("beforeend", '<span class="up-badge">' + UP_ICONS.pin + "</span>");
    else if (c.reel) cell.insertAdjacentHTML("beforeend", '<span class="up-badge">' + UP_ICONS.reel + "</span>");
    else if (c.multi) cell.insertAdjacentHTML("beforeend", '<span class="up-badge">' + UP_ICONS.multi + "</span>");
    if (c.seen) cell.insertAdjacentHTML("beforeend", '<span class="up-seen">閲覧済み</span>');

    cell.addEventListener("click", function () { openPostDetail({ account: upCurrent, cell: c, index: i }); });
    g.appendChild(cell);
  });
}
