/* stories.js — ストーリーズ（リング・ビューア・自分の投稿・足跡） */
"use strict";

function storyImgUrl(st) {
  // st は {seed, kw} を持つ。キーワードがあれば内容の合う画像を引く
  if (typeof st === "string") return "https://picsum.photos/seed/" + st + "/720/1280";
  if (st && st.kw) return kwImg(st.kw, 720, 1280, hashLock(st.seed));
  return "https://picsum.photos/seed/" + (st && st.seed) + "/720/1280";
}
/* seed文字列から固定のlock番号を作る（毎回同じ画像になる） */
function hashLock(seed) {
  var h = 0, s = String(seed || "x");
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 900 + 1;
}
/* 既読ストーリー（見たアカウントはリングが灰色になる） */
var seenStories = LS.get("seenStories", []);
var seenMyStories = LS.get("seenMyStories", []); // 自分のストーリーも見たら灰色になる
function markStorySeen(user) {
  if (seenStories.indexOf(user) >= 0) return;
  seenStories.push(user);
  LS.set("seenStories", seenStories);
  renderStories();
}
function markMyStorySeen(id) {
  if (!id || seenMyStories.indexOf(id) >= 0) return;
  seenMyStories.push(id);
  LS.set("seenMyStories", seenMyStories);
  renderStories();
}
/* 自分のストーリーに未読が1本でもあるか */
function myStoriesUnseen() {
  return myStories.some(function (s) { return seenMyStories.indexOf(s.id) < 0; });
}

function renderStories() {
  var wrap = $("stories");
  wrap.innerHTML = "";
  var me = document.createElement("div");
  me.className = "story";
  me.innerHTML = '<div class="ring"><div class="inner"></div><span class="plus-badge">＋</span></div><div class="name">ストーリーズ</div>';
  var ring = me.querySelector(".ring");
  // 未投稿、または全部見終わっている時はグレーのリング
  if (!myStories.length || !myStoriesUnseen()) ring.style.background = "#dbdbdb";
  me.querySelector(".inner").appendChild(myAvatarEl("face"));
  me.addEventListener("click", function () {
    if (myStories.length) openMyStory();
    else $("storyFileInput").click();
  });
  me.querySelector(".plus-badge").addEventListener("click", function (e) {
    e.stopPropagation();
    $("storyFileInput").click();
  });
  wrap.appendChild(me);
  DB.STORY_ACCOUNTS.forEach(function (acc, i) {
    var s = document.createElement("div");
    s.className = "story";
    s.innerHTML = '<div class="ring"><div class="inner"></div></div><div class="name"></div>';
    if (seenStories.indexOf(acc.user) >= 0) s.querySelector(".ring").style.background = "#dbdbdb"; // 既読
    s.querySelector(".inner").appendChild(storyIconEl(acc));
    s.querySelector(".name").textContent = acc.user;
    s.addEventListener("click", function () { openStory(i); });
    wrap.appendChild(s);
  });
}

/* アイコン画像（読み込み失敗時はイニシャル丸にフォールバック） */
function storyIconEl(st) {
  var img = document.createElement("img");
  img.className = "face-img";
  img.alt = "";
  img.src = st.icon;
  img.onerror = function () {
    var fb = avatarEl(st.user, "face");
    img.replaceWith(fb);
  };
  return img;
}

/* ===== story viewer（本家仕様: プログレスバーはアカウント内の本数分） ===== */
var svAccounts = [];  // 表示中のアカウント配列（他人 or 自分）
var svAcc = 0;        // 何番目のアカウントか
var svSlide = 0;      // そのアカウントの何本目か
var svCurrentRef = null; // 自分ストーリーの元データ（足跡用）
var svTimer = null;
var SV_DURATION = 5000;

function renderSvProgress() {
  var wrap = $("svProgress");
  wrap.innerHTML = "";
  svAccounts[svAcc].stories.forEach(function (_, i) {
    var b = document.createElement("div");
    b.className = "pbar" + (i < svSlide ? " done" : "");
    b.innerHTML = "<i></i>";
    wrap.appendChild(b);
  });
}
function svStartTimer() {
  clearInterval(svTimer);
  var bar = $("svProgress").children[svSlide].querySelector("i");
  var start = Date.now();
  svTimer = setInterval(function () {
    var t = Math.min(1, (Date.now() - start) / SV_DURATION);
    bar.style.width = (t * 100) + "%";
    if (t >= 1) svNext();
  }, 60);
}
function svShow() {
  var acc = svAccounts[svAcc];
  var st = acc.stories[svSlide];
  var slot = $("svAvatarSlot");
  slot.innerHTML = "";
  if (acc.own) {
    var mine = myAvatarEl();
    mine.style.width = "32px"; mine.style.height = "32px";
    slot.appendChild(mine);
  } else {
    var icon = storyIconEl(acc);
    icon.classList.add("sv-avatar-img");
    slot.appendChild(icon);
  }
  $("svName").textContent = acc.user;
  $("svTime").textContent = st.timeStr || (rand(1, 12) + "時間前");
  var svt = $("svText");
  svt.textContent = st.text || "";
  var pos = st.textPos || { x: 50, y: 88 }; // 位置未指定は従来どおり下寄せ
  svt.style.left = pos.x + "%";
  svt.style.top = pos.y + "%";
  var img = $("svImg");
  img.style.display = "";
  img.onerror = function () { img.style.display = "none"; }; // オフライン時はグラデ背景
  img.src = st.url || storyImgUrl(st);
  // 自分のストーリーだけ下部ツールバー＋いいねハート噴出
  svCurrentRef = st.ref || null;
  var tb = $("svToolbar");
  svStopHearts();
  if (acc.own && st.ref) {
    tb.hidden = false;
    $("svReply").hidden = true;
    markMyStorySeen(st.ref.id); // 自分のストーリーも見たら既読（リングが灰色になる）
    if (storyLikes(st.ref) >= 1) svStartHearts(); // いいねが1つでもあれば下からハートが噴き出す
  } else {
    tb.hidden = true;
    $("svReply").hidden = false; // 他人のストーリーには返信欄を出す
    if (acc.user) markStorySeen(acc.user);        // 見たら既読にする（リングが灰色になる）
  }
  renderSvProgress();
  svStartTimer();
  svPreloadNext();
}
/* 次のストーリー画像を先読みして切替時の待ちをなくす */
function svPreloadNext() {
  var acc = svAccounts[svAcc];
  var next = null;
  if (svSlide < acc.stories.length - 1) {
    next = acc.stories[svSlide + 1];
  } else if (svAcc < svAccounts.length - 1) {
    next = svAccounts[svAcc + 1].stories[0];
  }
  if (next && !next.url) {
    var im = new Image();
    im.src = storyImgUrl(next);
  }
}
function openStory(i) {
  svAccounts = DB.STORY_ACCOUNTS;
  svAcc = i;
  svSlide = 0;
  $("storyViewer").classList.add("open");
  svShow();
}
function openMyStory() {
  var mine = {
    user: HANDLE,
    own: true,
    stories: myStories.map(function (s) {
      return { url: s.url, text: s.text, textPos: s.textPos, ref: s, timeStr: timeAgo(s.time) };
    })
  };
  // 自分のストーリーが終わったら、そのまま他の人のストーリーへ自動で進む
  svAccounts = [mine].concat(DB.STORY_ACCOUNTS);
  svAcc = 0;
  svSlide = 0;
  $("storyViewer").classList.add("open");
  svShow();
}
function closeStory() {
  clearInterval(svTimer);
  svStopHearts();
  $("storyViewer").classList.remove("open");
}

/* ===== いいねハートの噴出（いいねが付いている自分ストーリーで下から湧く） ===== */
var svHeartTimer = null;
function svEmitHearts() {
  if ($("storyViewer").classList.contains("open") && !$("svToolbar").hidden) {
    flyHearts($("svActBtn"), 2);
  }
}
function svStartHearts() {
  svStopHearts();
  svEmitHearts();
  svHeartTimer = setInterval(svEmitHearts, 1500);
}
function svStopHearts() {
  clearInterval(svHeartTimer);
  svHeartTimer = null;
}
function svNext() {
  var acc = svAccounts[svAcc];
  if (svSlide < acc.stories.length - 1) {
    svSlide++;                       // 同じアカウントの次のストーリー
  } else if (svAcc < svAccounts.length - 1) {
    svAcc++; svSlide = 0;            // 次のアカウントへ（バーはリセット）
  } else {
    closeStory(); return;            // 最後まで見たら閉じる
  }
  svShow();
}
function svPrev() {
  if (svSlide > 0) {
    svSlide--;
  } else if (svAcc > 0) {
    svAcc--;                         // 前のアカウントへ（本家同様その先頭から）
    svSlide = 0;
  }
  svShow();
}

/* ===== ハイライト（プロフィールの丸アイコン列） ===== */
function renderHighlights() {
  var wrap = $("highlights");
  if (!wrap) return;
  wrap.innerHTML = "";
  // 先頭の「＋ 新規」（本家同様、ここからハイライトを追加する導線）
  var add = document.createElement("div");
  add.className = "hl";
  var plus = document.createElement("div");
  plus.className = "hl-cover hl-add";
  plus.textContent = "＋";
  var alabel = document.createElement("div");
  alabel.className = "hl-label";
  alabel.textContent = "新規";
  add.appendChild(plus);
  add.appendChild(alabel);
  add.addEventListener("click", function () { toast("ハイライトの追加は Coming soon 🚧"); });
  wrap.appendChild(add);

  DB.HIGHLIGHTS.forEach(function (h, i) {
    var el = document.createElement("div");
    el.className = "hl";
    var img = document.createElement("img");
    img.className = "hl-cover";
    img.alt = "";
    img.src = h.cover;
    img.onerror = function () { img.style.background = avatarColor(h.label); img.removeAttribute("src"); };
    var label = document.createElement("div");
    label.className = "hl-label";
    label.textContent = h.label;
    el.appendChild(img);
    el.appendChild(label);
    el.addEventListener("click", function () { openHighlight(i); });
    wrap.appendChild(el);
  });
}
function openHighlight(i) {
  var h = DB.HIGHLIGHTS[i];
  svAccounts = [{
    user: h.label,
    icon: h.cover,
    stories: h.stories.map(function (s) {
      return { seed: s.seed, text: s.text, timeStr: "ハイライト" };
    })
  }];
  svAcc = 0;
  svSlide = 0;
  $("storyViewer").classList.add("open");
  svShow();
}

/* ===== 自分のストーリー投稿＋足跡 ===== */
function viewersCount(s) {
  var mins = (Date.now() - s.time) / 60000;
  return Math.min(s.cap, Math.round(s.base + mins * s.rate));
}
/* いいね数は既読数の一定割合（ストーリーごとにlikeRatioで決まる） */
function storyLikes(s) {
  var ratio = s.likeRatio || 0.18;
  return Math.round(viewersCount(s) * ratio);
}

var pendingStoryFile = null;
var pendingStoryUrl = null;
var seText = "";                  // 入力中のテキスト
var sePos = { x: 50, y: 82 };     // テキスト位置（%・ドラッグで変わる）
function openStoryEditor(file) {
  pendingStoryFile = file;
  if (pendingStoryUrl) URL.revokeObjectURL(pendingStoryUrl);
  pendingStoryUrl = URL.createObjectURL(file);
  $("storyPreview").src = pendingStoryUrl;
  $("storyPreview").style.display = "";
  seText = "";
  sePos = { x: 50, y: 82 };
  $("storyTextInput").value = "";
  $("seTextEdit").hidden = true;
  $("seDragHint").hidden = true;
  renderSeText();
  $("storyEditor").classList.add("open");
}

/* Aa → テキスト入力モード */
function openSeTextEdit() {
  var inp = $("storyTextInput");
  inp.value = seText;
  $("seTextEdit").hidden = false;
  setTimeout(function () { inp.focus(); }, 30);
}
function commitSeText() {
  seText = $("storyTextInput").value.trim();
  $("seTextEdit").hidden = true;
  renderSeText();
}
/* ドラッグ可能なテキスト要素をステージに描く */
function renderSeText() {
  var layer = $("seTextLayer");
  layer.innerHTML = "";
  if (!seText) { $("seDragHint").hidden = true; return; }
  var el = document.createElement("div");
  el.className = "se-text-item";
  el.textContent = seText;
  el.style.left = sePos.x + "%";
  el.style.top = sePos.y + "%";
  el.addEventListener("mousedown", seDragStart);
  el.addEventListener("touchstart", seDragStart, { passive: false });
  layer.appendChild(el);
  $("seDragHint").hidden = false;
}
/* ===== テキストのドラッグ移動（マウス＋タッチ） ===== */
var seDragEl = null;
function seDragStart(e) {
  seDragEl = e.currentTarget;
  seDragEl.classList.add("dragging");
  e.preventDefault();
}
function seDragMove(e) {
  if (!seDragEl) return;
  var pt = e.touches ? e.touches[0] : e;
  var r = $("seStage").getBoundingClientRect();
  sePos.x = Math.max(8, Math.min(92, (pt.clientX - r.left) / r.width * 100));
  sePos.y = Math.max(8, Math.min(92, (pt.clientY - r.top) / r.height * 100));
  seDragEl.style.left = sePos.x + "%";
  seDragEl.style.top = sePos.y + "%";
  e.preventDefault();
}
function seDragEnd() {
  if (seDragEl) { seDragEl.classList.remove("dragging"); seDragEl = null; }
}
document.addEventListener("mousemove", seDragMove);
document.addEventListener("mouseup", seDragEnd);
document.addEventListener("touchmove", seDragMove, { passive: false });
document.addEventListener("touchend", seDragEnd);

function shareStory() {
  if (!pendingStoryFile) return;
  var text = seText;
  var pos = { x: sePos.x, y: sePos.y };
  $("storyEditor").classList.remove("open");
  fileToResizedBlob(pendingStoryFile, 1080, 0.85).then(function (blob) {
    var story = {
      id: "s" + Date.now(),
      blob: blob,
      text: text,
      textPos: pos,
      time: Date.now(),
      base: rand(80, 200),   // 初動の既読数
      rate: rand(3, 9),      // 1分ごとの増加
      cap: rand(2000, 6000), // 上限
      likeRatio: (12 + rand(0, 16)) / 100 // 既読のうちいいねする割合(12〜28%)
    };
    dbPutIn("stories", story).catch(function () {});
    story.url = URL.createObjectURL(blob);
    myStories.push(story);
    renderStories();
    toast("ストーリーズをシェアしました");
    setTimeout(function () {
      unreadNotifs += rand(10, 30);
      LS.set("unreadNotifs", unreadNotifs);
      updateBadges();
      banner("👁", BRAND, "あなたのストーリーズが伸びています（既読 " + fmt(viewersCount(story)) + "人）");
    }, 15000);
  }).catch(function (e) {
    toast("画像の読み込みに失敗しました: " + e.message);
  });
  pendingStoryFile = null;
}

/* 足跡（閲覧者リスト） */
function openViewersSheet(story) {
  var n = viewersCount(story);
  $("viewersTitle").textContent = "閲覧者 " + fmt(n) + "人";
  var list = $("viewersList");
  list.innerHTML = "";
  // 有名人風が先頭に並ぶ（本家の「注目の閲覧者」風）
  var celebs = DB.PERSONAS.celeb.names.slice(0, 2 + rand(0, 1));
  celebs.forEach(function (nm) {
    list.appendChild(viewerRow(nm, true, "さっき"));
  });
  var shown = Math.min(n, 120);
  for (var i = celebs.length; i < shown; i++) {
    var pk = weightedPersona();
    var nm2 = makeName(pick(DB.PERSONAS[pk].names));
    list.appendChild(viewerRow(nm2, false, rand(1, 59) + "分前"));
  }
  if (n > shown) {
    var more = document.createElement("div");
    more.className = "viewers-more";
    more.textContent = "他 " + fmt(n - shown) + "人が閲覧しました";
    list.appendChild(more);
  }
  $("viewersSheet").classList.add("open");
}
/* アクティビティ（既読＋いいねの要約＋いいねした人リスト） */
function openStoryActivity(story) {
  var v = viewersCount(story), n = storyLikes(story);
  $("viewersTitle").textContent = "アクティビティ";
  var list = $("viewersList");
  list.innerHTML = "";
  var sum = document.createElement("div");
  sum.className = "activity-summary";
  sum.textContent = "👁 " + fmt(v) + "人が既読　・　❤️ " + fmt(n) + "件のいいね";
  list.appendChild(sum);
  var celebs = DB.PERSONAS.celeb.names.slice(0, 1 + rand(0, 1));
  celebs.forEach(function (nm) {
    list.appendChild(viewerRow(nm, true, "❤️ さっき"));
  });
  var shown = Math.min(n, 120);
  for (var i = celebs.length; i < shown; i++) {
    var pk = weightedPersona();
    var nm2 = makeName(pick(DB.PERSONAS[pk].names));
    list.appendChild(viewerRow(nm2, false, "❤️ " + rand(1, 59) + "分前"));
  }
  if (n > shown) {
    var more = document.createElement("div");
    more.className = "viewers-more";
    more.textContent = "他 " + fmt(n - shown) + "人がいいねしました";
    list.appendChild(more);
  }
  $("viewersSheet").classList.add("open");
}
function viewerRow(name, verified, ago) {
  var row = document.createElement("div");
  row.className = "viewer-row";
  row.appendChild(avatarEl(name));
  var b = document.createElement("div");
  var vn = document.createElement("span");
  vn.className = "vn";
  vn.textContent = name;
  if (verified) vn.insertAdjacentHTML("beforeend", VBADGE);
  var sub = document.createElement("div");
  sub.className = "vsub";
  sub.textContent = ago;
  b.appendChild(vn);
  b.appendChild(sub);
  row.appendChild(b);
  return row;
}
