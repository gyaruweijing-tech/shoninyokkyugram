/* views.js — DM・通知タブ・プロフィール（表示/編集）・ビュー切替 */
"use strict";

/* ================= DM view ================= */
function renderDms() {
  var wrap = $("dmList");
  wrap.innerHTML = "";
  if (!dms.length) {
    wrap.innerHTML = '<div class="dm-empty">まだメッセージはありません。<br>投稿すれば……来ますよ、案件が。</div>';
    return;
  }
  dms.forEach(function (d) {
    var item = document.createElement("div");
    item.className = "dm-item";
    item.appendChild(avatarEl(d.name));
    var b = document.createElement("div");
    b.innerHTML = '<div class="dm-name"></div><div class="dm-prev"></div>';
    b.querySelector(".dm-name").textContent = d.name;
    b.querySelector(".dm-prev").textContent = d.msg.split("\n")[0];
    item.appendChild(b);
    item.addEventListener("click", function () {
      $("dmSheetTitle").firstChild.textContent = d.name;
      $("dmDetail").innerHTML = "";
      var bub = document.createElement("div");
      bub.className = "bubble";
      bub.textContent = d.msg;
      $("dmDetail").appendChild(bub);
      var note = document.createElement("p");
      note.style.cssText = "font-size:11px;color:#8e8e8e;margin-top:12px";
      note.textContent = "※ 返信機能はありません。インフルエンサーは忙しいので。";
      $("dmDetail").appendChild(note);
      $("dmSheet").classList.add("open");
    });
    wrap.appendChild(item);
  });
}

function updateBadges() {
  var b = $("dmBadge");
  b.textContent = unreadDms;
  b.classList.toggle("show", unreadDms > 0);
  var nb = $("bellBadge");
  nb.textContent = unreadNotifs > 99 ? "99+" : unreadNotifs;
  nb.classList.toggle("show", unreadNotifs > 0);
}

/* ================= 通知（アクティビティ）タブ ================= */
function pickNotifTemplate() {
  var total = 0;
  DB.NOTIF_TEMPLATES.forEach(function (t) { total += t.w; });
  var r = Math.random() * total;
  for (var i = 0; i < DB.NOTIF_TEMPLATES.length; i++) {
    r -= DB.NOTIF_TEMPLATES[i].w;
    if (r <= 0) return DB.NOTIF_TEMPLATES[i].t;
  }
  return DB.NOTIF_TEMPLATES[0].t;
}
function notifItem(agoText) {
  var pk = weightedPersona();
  var nm = makeName(pick(DB.PERSONAS[pk].names));
  var item = document.createElement("div");
  item.className = "notif-item";
  item.appendChild(avatarEl(nm));
  var nt = document.createElement("div");
  nt.className = "nt";
  var b = document.createElement("b");
  b.textContent = nm;
  nt.appendChild(b);
  nt.appendChild(document.createTextNode(pickNotifTemplate()));
  var ago = document.createElement("span");
  ago.className = "ago";
  ago.textContent = agoText;
  nt.appendChild(ago);
  item.appendChild(nt);
  return item;
}
function renderNotifs() {
  var list = $("notifList");
  list.innerHTML = "";
  var secToday = document.createElement("div");
  secToday.className = "notif-section";
  secToday.textContent = "今日";
  list.appendChild(secToday);
  var nToday = rand(12, 20);
  for (var i = 0; i < nToday; i++) {
    list.appendChild(notifItem(i < 3 ? rand(1, 9) + "分前" : rand(1, 23) + "時間前"));
  }
  var secWeek = document.createElement("div");
  secWeek.className = "notif-section";
  secWeek.textContent = "今週";
  list.appendChild(secWeek);
  var nWeek = rand(15, 25);
  for (var j = 0; j < nWeek; j++) {
    list.appendChild(notifItem(rand(1, 6) + "日前"));
  }
}

/* ================= profile ================= */
function updateProfileStats() {
  $("statPosts").textContent = posts.length;
  $("statFollowers").textContent = fmtShort(followers);
  $("profileName").textContent = HANDLE;
  $("profileBio1").textContent = profile.bio1;
  $("profileBio2").textContent = profile.bio2;
  var slot = $("profileAvatarSlot");
  slot.innerHTML = "";
  slot.appendChild(myAvatarEl());
}

/* プロフィール編集 */
function openProfileEdit() {
  $("peHandle").value = profile.handle;
  $("peBio1").value = profile.bio1;
  $("peBio2").value = profile.bio2;
  var slot = $("peAvatarSlot");
  slot.innerHTML = "";
  slot.appendChild(myAvatarEl());
  $("profileEditSheet").classList.add("open");
}
function saveProfile() {
  var h = $("peHandle").value.trim().replace(/\s+/g, "_");
  if (h) profile.handle = h.slice(0, 30);
  profile.bio1 = $("peBio1").value.trim() || profile.bio1;
  profile.bio2 = $("peBio2").value.trim();
  HANDLE = profile.handle;
  LS.set("profile", profile);
  $("profileEditSheet").classList.remove("open");
  renderNavAvatar();
  renderStories();
  updateProfileStats();
  rerenderFeed();
  toast("プロフィールを更新しました");
}
function setAvatarFromFile(file) {
  fileToResizedBlob(file, 128, 0.8).then(function (blob) {
    var fr = new FileReader();
    fr.onload = function () {
      profile.avatar = String(fr.result); // dataURL（端末内のみ）
      LS.set("profile", profile);
      var slot = $("peAvatarSlot");
      slot.innerHTML = "";
      slot.appendChild(myAvatarEl());
      renderNavAvatar();
      renderStories();
      updateProfileStats();
      toast("プロフィール写真を変更しました");
    };
    fr.readAsDataURL(blob);
  }).catch(function () { toast("画像の読み込みに失敗しました"); });
}
function rerenderFeed() {
  $("feed").innerHTML = "";
  posts.forEach(function (p) { renderPost(p, false); });
}
function renderProfileGrid() {
  var g = $("profileGrid");
  g.innerHTML = "";
  if (!posts.length) {
    g.innerHTML = '<div class="grid-empty">まだ投稿がありません。<br>下の＋から人生初バズをどうぞ。</div>';
    return;
  }
  posts.forEach(function (p) {
    var img = document.createElement("img");
    img.src = p.url;
    img.addEventListener("click", function () {
      switchView("home");
      var el = document.querySelector('[data-id="' + p.id + '"]');
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
    g.appendChild(img);
  });
}

/* ================= views ================= */
function switchView(name) {
  ["home", "dm", "profile", "notif"].forEach(function (v) {
    $("view-" + v).classList.toggle("active", v === name);
  });
  if (name === "dm") {
    unreadDms = 0;
    LS.set("unreadDms", 0);
    updateBadges();
    renderDms();
  }
  if (name === "notif") {
    unreadNotifs = 0;
    LS.set("unreadNotifs", 0);
    updateBadges();
    renderNotifs();
  }
  if (name === "profile") { updateProfileStats(); renderProfileGrid(); }
}
