/* main.js — イベント結線と初期化（必ず最後に読み込む） */
"use strict";

/* ================= events ================= */
document.querySelectorAll("[data-nav]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var nav = btn.dataset.nav;
    if (nav === "home") switchView("home");
    else if (nav === "profile") switchView("profile");
    else if (nav === "dm") switchView("dm");
    else if (nav === "search") switchView("search");
    else if (nav === "reels") switchView("reels");
  });
});
$("newPostTop").addEventListener("click", function () { $("fileInput").click(); });
window.addEventListener("scroll", exOnScroll, { passive: true });
window.addEventListener("resize", exOnScroll);
$("exSearchInput").addEventListener("focus", function () {
  exRenderSuggest();
  $("exSuggest").hidden = false;
});
$("exSearchInput").addEventListener("input", function () {
  if (!$("exSuggest").hidden) return;
  exRenderSuggest();
  $("exSuggest").hidden = false;
});
$("exSearchInput").addEventListener("blur", function () {
  setTimeout(function () { $("exSuggest").hidden = true; }, 200); // 行タップを拾うため少し遅らせる
});
$("notifBell").addEventListener("click", function () { switchView("notif"); });
$("notifBack").addEventListener("click", function () { switchView("home"); });
$("settingsBack").addEventListener("click", function () { switchView("profile"); });
$("savedBack").addEventListener("click", function () { switchView(savedReturnView); });
$("savedAdd").addEventListener("click", function () { toast("新しいコレクションは Coming soon 🚧"); });
$("settingsSearch").addEventListener("input", function () { renderSettings(this.value); });
$("fileInput").addEventListener("change", function () {
  if (this.files && this.files[0]) openCompose(this.files[0]);
  this.value = "";
});
$("storyFileInput").addEventListener("change", function () {
  if (this.files && this.files[0]) openStoryEditor(this.files[0]);
  this.value = "";
});
$("storyEditCancel").addEventListener("click", function () {
  $("storyEditor").classList.remove("open");
  pendingStoryFile = null;
});
$("storyShare").addEventListener("click", shareStory);
$("seSend").addEventListener("click", shareStory);
$("seToolText").addEventListener("click", openSeTextEdit);
$("seTextDone").addEventListener("click", commitSeText);
$("storyTextInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") { e.preventDefault(); commitSeText(); }
});
$("seCloseFriends").addEventListener("click", function () { toast("親しい友達は Coming soon 🚧"); });
document.querySelectorAll("[data-se-cs]").forEach(function (b) {
  b.addEventListener("click", function () { toast("Coming soon 🚧"); });
});
$("svActBtn").addEventListener("click", function () {
  if (svCurrentRef) {
    clearInterval(svTimer); // アクティビティを見てる間はストーリーを止める
    openStoryActivity(svCurrentRef);
  }
});
document.querySelectorAll("[data-sv-cs]").forEach(function (b) {
  b.addEventListener("click", function () { toast("Coming soon 🚧"); });
});
$("viewersClose").addEventListener("click", function () {
  $("viewersSheet").classList.remove("open");
  if ($("storyViewer").classList.contains("open")) svStartTimer();
});
$("viewersSheet").addEventListener("click", function (e) {
  if (e.target === this) {
    this.classList.remove("open");
    if ($("storyViewer").classList.contains("open")) svStartTimer();
  }
});
$("followersStat").addEventListener("click", openFollowersSheet);
$("followersClose").addEventListener("click", function () { $("followersSheet").classList.remove("open"); });
$("followersSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("editProfileBtn").addEventListener("click", openProfileEdit);
/* プロフィール（本家UI） */
$("pfNewPost").addEventListener("click", function () { $("fileInput").click(); });
$("pfMenu").addEventListener("click", openProfileMenu);
$("pfMenuClose").addEventListener("click", function () { $("pfMenuSheet").classList.remove("open"); });
$("pfMenuSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("discoverBtn").addEventListener("click", toggleDiscover);
$("shareProfileBtn").addEventListener("click", function () { toast("プロフィールのシェアは Coming soon 🚧"); });
$("pfThreads").addEventListener("click", function () { toast("Threadsは Coming soon 🚧"); });
$("pfBanner").addEventListener("click", function () { toast("バナーの追加は Coming soon 🚧"); });
$("pfNote").addEventListener("click", function () { toast("ノートは Coming soon 🚧"); });
$("pfSeeAll").addEventListener("click", function () { toast("すべて見るは Coming soon 🚧"); });
$("pfAvPlus").addEventListener("click", function () { $("storyFileInput").click(); });
$("pfAccountBtn").addEventListener("click", function () { toast("アカウント切替は Coming soon 🚧"); });
document.querySelectorAll("[data-pftab]").forEach(function (b) {
  b.addEventListener("click", function () { setProfileTab(b.dataset.pftab); });
});
/* リール */
$("reelsFeed").addEventListener("scroll", rlOnScroll, { passive: true });
$("rlNewPost").addEventListener("click", function () { $("fileInput").click(); });
$("rlTabFriends").addEventListener("click", function () { toast("友達タブは Coming soon 🚧"); });
$("peAvatarChange").addEventListener("click", function () { $("avatarFileInput").click(); });
$("avatarFileInput").addEventListener("change", function () {
  if (this.files && this.files[0]) setAvatarFromFile(this.files[0]);
  this.value = "";
});
$("peSave").addEventListener("click", saveProfile);
$("profileEditClose").addEventListener("click", function () { $("profileEditSheet").classList.remove("open"); });
$("profileEditSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
/* 投稿の「···」メニュー */
$("postMenuClose").addEventListener("click", function () { $("postMenuSheet").classList.remove("open"); });
$("postMenuSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
/* 他人のストーリーへの返信 */
$("svReplyInput").addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  var t = this.value.trim();
  if (!t) return;
  this.value = "";
  this.blur();
  toast("メッセージを送信しました💬");
});
document.querySelectorAll("[data-sv-react]").forEach(function (b) {
  b.addEventListener("click", function () {
    flyHearts(b, 4);
    toast(b.dataset.svReact + " を送信しました");
  });
});
$("commentSend").addEventListener("click", submitOwnComment);
$("commentInput").addEventListener("keydown", function (e) { if (e.key === "Enter") submitOwnComment(); });
$("composeCancel").addEventListener("click", function () {
  $("composeModal").classList.remove("open");
  pendingFile = null;
});
$("toStep2").addEventListener("click", function () {
  $("cmStep1").hidden = true;
  $("cmStep2").hidden = false;
});
$("backStep1").addEventListener("click", function () {
  $("cmStep2").hidden = true;
  $("cmStep1").hidden = false;
});
$("ceMusic").addEventListener("click", function () { toast("音源の追加は Coming soon 🚧"); });
document.querySelectorAll("[data-cs]").forEach(function (b) {
  b.addEventListener("click", function () { toast("Coming soon 🚧"); });
});
$("composeShare").addEventListener("click", share);
$("sheetClose").addEventListener("click", function () { $("commentSheet").classList.remove("open"); });
$("commentSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("insightClose").addEventListener("click", function () { $("insightSheet").classList.remove("open"); });
$("insightSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("dmSend").addEventListener("click", sendDmReply);
$("dmReplyInput").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); sendDmReply(); } });
$("dmSheetClose").addEventListener("click", function () { $("dmSheet").classList.remove("open"); });
$("dmSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("buzzClose").addEventListener("click", function () { $("buzzOverlay").classList.remove("show"); });
$("svClose").addEventListener("click", closeStory);
$("svNext").addEventListener("click", svNext);
$("svPrev").addEventListener("click", svPrev);

/* ================= init ================= */
// まず画面を描く（DB読み込みに失敗・ブロックされてもUIは出る）
renderStories();
renderNavAvatar();
updateBadges();
updateProfileStats();
renderCommentEmoji();
renderMusicCards();

openDb().then(function () {
  return dbAll().then(function (saved) {
    saved.sort(function (a, b) { return b.time - a.time; });
    saved.forEach(function (s) {
      var post = {
        id: s.id, blob: s.blob, url: URL.createObjectURL(s.blob),
        caption: s.caption, likesTarget: s.likesTarget, likesShown: s.likesShown,
        savesTarget: s.savesTarget, savesShown: s.savesShown,
        sharesTarget: s.sharesTarget, sharesShown: s.sharesShown, mySaved: s.mySaved,
        comments: s.comments || [], time: s.time, buzz: s.buzz, myLike: s.myLike
      };
      posts.push(post);
      renderPost(post, false);
    });
    return dbAllFrom("stories");
  }).then(function (stories) {
    var now = Date.now();
    stories.sort(function (a, b) { return a.time - b.time; });
    stories.forEach(function (s) {
      if (now - s.time > 24 * 3600 * 1000) {
        dbDeleteFrom("stories", s.id); // 本家同様24時間で消える
      } else {
        s.url = URL.createObjectURL(s.blob);
        myStories.push(s);
      }
    });
  });
}).catch(function () {
  toast("この環境ではデータ保存が使えません（表示のみ）");
}).then(function () {
  // 留守中に承認欲求が溜まっている演出
  if (posts.length || myStories.length) {
    unreadNotifs += rand(4, 18);
    LS.set("unreadNotifs", unreadNotifs);
  }
  renderStories();
  renderNavAvatar();
  updateBadges();
  updateProfileStats();
  renderSeedPosts(); // 公式/他人の投稿（自分の投稿の下に並ぶ）

  // 画像は loremflickr 経由で1.5〜2秒かかるため、他タブ分を裏で温めておく
  // （一度読めばブラウザキャッシュに載るので、開いた時には表示済みになる）
  setTimeout(function () {
    var urls = [];
    DB.EXPLORE_ITEMS.forEach(function (i) { urls.push(kwImg(i.kw, 360, 480, hashLock(i.seed))); });
    DB.STORY_ACCOUNTS.forEach(function (a) { a.stories.forEach(function (s) { urls.push(storyImgUrl(s)); }); });
    DB.PROFILE_REELS.forEach(function (r) { urls.push(kwImg(r.kw, 360, 640, hashLock(r.seed))); });
    DB.PROFILE_TAGGED.forEach(function (t) { urls.push(kwImg(t.kw, 400, 400, hashLock(t.seed))); });
    prewarm(urls);
  }, 1500);
});

// デバッグ用（動作検証で使う）
window.KUSO_APP = { openCompose: openCompose, share: share, openStoryEditor: openStoryEditor, shareStory: shareStory };
