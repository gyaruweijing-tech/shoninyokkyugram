/* main.js — イベント結線と初期化（必ず最後に読み込む） */
"use strict";

/* ================= events ================= */
document.querySelectorAll("[data-nav]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var nav = btn.dataset.nav;
    if (nav === "home") switchView("home");
    else if (nav === "profile") switchView("profile");
    else if (nav === "new") $("fileInput").click();
    else toast(nav === "reels" ? "リールは Coming soon 🚧" : "検索は Coming soon 🚧");
  });
});
$("dmBtn").addEventListener("click", function () { switchView("dm"); });
$("notifBell").addEventListener("click", function () { switchView("notif"); });
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
$("storyTextInput").addEventListener("input", function () {
  $("seOverlayPreview").textContent = this.value;
});
$("svViewersChip").addEventListener("click", function () {
  if (svCurrentRef) {
    clearInterval(svTimer); // 足跡を見てる間はストーリーを止める
    openViewersSheet(svCurrentRef);
  }
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
$("editProfileBtn").addEventListener("click", openProfileEdit);
$("peAvatarChange").addEventListener("click", function () { $("avatarFileInput").click(); });
$("avatarFileInput").addEventListener("change", function () {
  if (this.files && this.files[0]) setAvatarFromFile(this.files[0]);
  this.value = "";
});
$("peSave").addEventListener("click", saveProfile);
$("profileEditClose").addEventListener("click", function () { $("profileEditSheet").classList.remove("open"); });
$("profileEditSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
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
$("rePick").addEventListener("click", function () { $("fileInput").click(); });
document.querySelectorAll("[data-cs]").forEach(function (b) {
  b.addEventListener("click", function () { toast("Coming soon 🚧"); });
});
$("composeShare").addEventListener("click", share);
$("sheetClose").addEventListener("click", function () { $("commentSheet").classList.remove("open"); });
$("commentSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
$("insightClose").addEventListener("click", function () { $("insightSheet").classList.remove("open"); });
$("insightSheet").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
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

openDb().then(function () {
  return dbAll().then(function (saved) {
    saved.sort(function (a, b) { return b.time - a.time; });
    saved.forEach(function (s) {
      var post = {
        id: s.id, blob: s.blob, url: URL.createObjectURL(s.blob),
        caption: s.caption, likesTarget: s.likesTarget, likesShown: s.likesShown,
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
});

// デバッグ用（動作検証で使う）
window.KUSO_APP = { openCompose: openCompose, share: share, openStoryEditor: openStoryEditor, shareStory: shareStory };
