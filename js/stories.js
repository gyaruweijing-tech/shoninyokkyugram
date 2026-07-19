/* stories.js — ストーリーズ（リング・ビューア・自分の投稿・足跡） */
"use strict";

function storyImgUrl(seed) {
  return "https://picsum.photos/seed/" + seed + "/720/1280";
}
function renderStories() {
  var wrap = $("stories");
  wrap.innerHTML = "";
  var me = document.createElement("div");
  me.className = "story";
  me.innerHTML = '<div class="ring"><div class="inner"></div><span class="plus-badge">＋</span></div><div class="name">ストーリーズ</div>';
  var ring = me.querySelector(".ring");
  if (!myStories.length) ring.style.background = "#dbdbdb";
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
  $("svText").textContent = st.text || "";
  var img = $("svImg");
  img.style.display = "";
  img.onerror = function () { img.style.display = "none"; }; // オフライン時はグラデ背景
  img.src = st.url || storyImgUrl(st.seed);
  // 足跡チップ（自分のストーリーだけ）
  svCurrentRef = st.ref || null;
  var chip = $("svViewersChip");
  if (acc.own && st.ref) {
    $("svViewersCount").textContent = fmt(viewersCount(st.ref));
    chip.hidden = false;
  } else {
    chip.hidden = true;
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
    im.src = storyImgUrl(next.seed);
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
  svAccounts = [{
    user: HANDLE,
    own: true,
    stories: myStories.map(function (s) {
      return { url: s.url, text: s.text, ref: s, timeStr: timeAgo(s.time) };
    })
  }];
  svAcc = 0;
  svSlide = 0;
  $("storyViewer").classList.add("open");
  svShow();
}
function closeStory() {
  clearInterval(svTimer);
  $("storyViewer").classList.remove("open");
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

/* ===== 自分のストーリー投稿＋足跡 ===== */
function viewersCount(s) {
  var mins = (Date.now() - s.time) / 60000;
  return Math.min(s.cap, Math.round(s.base + mins * s.rate));
}

var pendingStoryFile = null;
var pendingStoryUrl = null;
function openStoryEditor(file) {
  pendingStoryFile = file;
  if (pendingStoryUrl) URL.revokeObjectURL(pendingStoryUrl);
  pendingStoryUrl = URL.createObjectURL(file);
  $("storyPreview").src = pendingStoryUrl;
  $("storyTextInput").value = "";
  $("seOverlayPreview").textContent = "";
  $("storyEditor").classList.add("open");
}
function shareStory() {
  if (!pendingStoryFile) return;
  var text = $("storyTextInput").value.trim();
  $("storyEditor").classList.remove("open");
  fileToResizedBlob(pendingStoryFile, 1080, 0.85).then(function (blob) {
    var story = {
      id: "s" + Date.now(),
      blob: blob,
      text: text,
      time: Date.now(),
      base: rand(80, 200),   // 初動の既読数
      rate: rand(3, 9),      // 1分ごとの増加
      cap: rand(2000, 6000)  // 上限
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
