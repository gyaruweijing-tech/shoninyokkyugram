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
    item.addEventListener("click", function () { openDmThread(d); });
    wrap.appendChild(item);
  });
}

/* ================= DM会話（返信＋企業の小芝居） ================= */
var currentDm = null;
function openDmThread(d) {
  currentDm = d;
  if (!d.thread) d.thread = [{ who: "them", text: d.msg }];
  $("dmSheetTitle").firstChild.textContent = d.name;
  renderDmThread(d);
  $("dmReplyInput").value = "";
  $("dmSheet").classList.add("open");
}
function renderDmThread(d) {
  var wrap = $("dmDetail");
  wrap.innerHTML = "";
  d.thread.forEach(function (m) {
    var b = document.createElement("div");
    b.className = "dm-bubble " + m.who;
    b.textContent = m.text;
    wrap.appendChild(b);
  });
  wrap.scrollTop = wrap.scrollHeight;
}
function sendDmReply() {
  var d = currentDm;
  if (!d) return;
  var text = $("dmReplyInput").value.trim();
  if (!text) return;
  d.thread.push({ who: "me", text: text });
  $("dmReplyInput").value = "";
  renderDmThread(d);
  LS.set("dms", dms);
  // 「入力中…」→ 企業からの段階的な返信
  var wrap = $("dmDetail");
  var typing = document.createElement("div");
  typing.className = "dm-typing";
  typing.textContent = d.name + " が入力中…";
  wrap.appendChild(typing);
  wrap.scrollTop = wrap.scrollHeight;
  var idx = d.replyIdx || 0;
  var reply = d.person
    ? pick(DB.DM_PEOPLE_REPLIES) // 一般の人：本人から返信が来て大興奮
    : DB.DM_REPLIES[Math.min(idx, DB.DM_REPLIES.length - 1)].replace(/〇〇/g, (profile.name || HANDLE));
  d.replyIdx = idx + 1;
  setTimeout(function () {
    d.thread.push({ who: "them", text: reply });
    renderDmThread(d);
    LS.set("dms", dms);
    // 返信＝ファンサービス。相手が周囲に広めてフォロワーが増える
    if (d.person) {
      var base = Math.max(20, Math.round(followers * 0.004 * (0.6 + Math.random())));
      setTimeout(function () {
        addFollowers(base, pick([
          d.name + "さんが友達に紹介しました！",
          d.name + "さんが「神対応された」と投稿しました！",
          "「返信もらえた」がシェアされています！"
        ]));
      }, 1200);
    }
  }, 1500);
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
var NT_HEART_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.6-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.4 12 21 12 21z"/></svg>';

function pickNotifKind() {
  var total = 0;
  DB.NOTIF_KINDS.forEach(function (t) { total += t.w; });
  var r = Math.random() * total;
  for (var i = 0; i < DB.NOTIF_KINDS.length; i++) {
    r -= DB.NOTIF_KINDS[i].w;
    if (r <= 0) return DB.NOTIF_KINDS[i].k;
  }
  return "postLike";
}
/* 右側のサムネは自分の投稿を優先（自分の投稿への反応に見える） */
function notifThumb() {
  var img = document.createElement("img");
  img.className = "nt-thumb";
  img.alt = "";
  img.loading = "lazy";
  var mine = posts.length ? pick(posts) : null;
  var seed = "nt" + rand(1, 999);
  img.src = mine ? mine.url : "https://picsum.photos/seed/" + seed + "/88/88";
  img.style.cursor = "pointer";
  img.addEventListener("click", function (e) {
    e.stopPropagation();  // 行のクリックより優先
    openPostDetail(mine ? { post: mine } : { seed: seed, kw: "photo" });
  });
  return img;
}
function ntFollowBtn(primary) {
  var btn = document.createElement("button");
  btn.className = "nt-follow-btn" + (primary ? " primary" : "");
  btn.textContent = primary ? "フォロー" : "フォロー中";
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var on = btn.classList.toggle("primary");
    btn.textContent = on ? "フォロー" : "フォロー中";
  });
  return btn;
}
function notifItem(kind, agoText) {
  var pk = weightedPersona();
  var nm = makeName(pick(DB.PERSONAS[pk].names));
  var item = document.createElement("div");
  item.className = "notif-item";

  /* --- フォローのおすすめだけ形が違う --- */
  if (kind === "suggest") {
    var acct = pick(DB.SUGGEST_ACCOUNTS);
    var ring = document.createElement("div");
    ring.className = "nt-suggest-ring";
    ring.appendChild(linkToUser(avatarEl(acct), acct));
    item.appendChild(ring);
    var sn = document.createElement("div");
    sn.className = "nt";
    sn.appendChild(document.createTextNode("フォローのおすすめ: "));
    var sb = document.createElement("b");
    sb.textContent = acct;
    sn.appendChild(linkToUser(sb, acct));
    var ssub = document.createElement("div");
    ssub.className = "nt-req-sub";
    ssub.textContent = agoText + "・共通の友達" + rand(2, 14) + "人";
    sn.appendChild(ssub);
    item.appendChild(sn);
    item.appendChild(ntFollowBtn(true));
    return item;
  }

  var liked = (kind === "storyLike" || kind === "postLike");
  var avw = document.createElement("div");
  avw.className = "nt-avwrap";
  avw.appendChild(linkToUser(avatarEl(nm), nm));
  if (liked) {
    var h = document.createElement("div");
    h.className = "nt-heart";
    h.innerHTML = NT_HEART_SVG;
    avw.appendChild(h);
  }
  item.appendChild(avw);

  var nt = document.createElement("div");
  nt.className = "nt";
  var b = document.createElement("b");
  b.textContent = nm;
  nt.appendChild(linkToUser(b, nm));

  if (kind === "storyLike") {
    var nm2 = makeName(pick(DB.PERSONAS[weightedPersona()].names));
    nt.appendChild(document.createTextNode("、"));
    var b2 = document.createElement("b");
    b2.textContent = nm2;
    nt.appendChild(linkToUser(b2, nm2));
    nt.appendChild(document.createTextNode(" 他" + rand(8, 90) + "人があなたのストーリーズに「いいね！」しました。"));
  } else if (kind === "postLike") {
    nt.appendChild(document.createTextNode(" 他" + rand(12, 3200) + "人があなたの投稿に「いいね！」しました。"));
  } else if (kind === "follow") {
    nt.appendChild(document.createTextNode("があなたをフォローしました。"));
  } else if (kind === "comment") {
    nt.appendChild(document.createTextNode("があなたの投稿にコメントしました: 「" + pick(DB.PERSONAS[pk].texts) + "」"));
  } else if (kind === "mention") {
    nt.appendChild(document.createTextNode("がストーリーズであなたをメンションしました。"));
  } else if (kind === "save") {
    nt.appendChild(document.createTextNode("があなたの投稿を保存しました。"));
  } else if (kind === "share") {
    nt.insertAdjacentHTML("beforeend", VBADGE);
    nt.appendChild(document.createTextNode("が新しい投稿" + rand(1, 4) + "件をシェアしました。"));
  }

  var ago = document.createElement("span");
  ago.className = "ago";
  ago.textContent = agoText;
  nt.appendChild(ago);
  item.appendChild(nt);

  // 右端：フォローされた通知はボタンなし（こちらからフォローバックはしない）。それ以外はサムネ
  if (kind !== "follow") item.appendChild(notifThumb());
  return item;
}

/* 上部の「新しいフォロワー」行
   （オープンアカウントなのでリクエスト承認は無し。勝手にフォローされていく） */
function newFollowersRow() {
  var nm = makeName(pick(DB.PERSONAS[weightedPersona()].names));
  var row = document.createElement("div");
  row.className = "nt-req";
  row.appendChild(avatarEl(nm));
  var body = document.createElement("div");
  body.className = "nt-req-body";
  var t = document.createElement("div");
  t.className = "nt-req-title";
  t.textContent = "新しいフォロワー";
  var s = document.createElement("div");
  s.className = "nt-req-sub";
  s.textContent = nm + " + 他" + rand(18, 90) + "人があなたをフォローしました";
  body.appendChild(t);
  body.appendChild(s);
  row.appendChild(body);
  var dot = document.createElement("span");
  dot.className = "nt-bluedot";
  row.appendChild(dot);
  var arrow = document.createElement("span");
  arrow.className = "nt-arrow";
  arrow.textContent = "›";
  row.appendChild(arrow);
  row.addEventListener("click", openFollowersSheet); // フォロワー一覧へ
  return row;
}

function ntSection(label) {
  var s = document.createElement("div");
  s.className = "notif-section";
  s.textContent = label;
  return s;
}
function ntOldDate(daysAgo) {
  var d = new Date(Date.now() - daysAgo * 86400000);
  return (d.getMonth() + 1) + "月" + d.getDate() + "日";
}
function renderNotifs() {
  var list = $("notifList");
  list.innerHTML = "";
  $("notifAccount").textContent = HANDLE;
  list.appendChild(newFollowersRow());

  list.appendChild(ntSection("過去7日間"));
  var n7 = rand(9, 13);
  for (var i = 0; i < n7; i++) {
    var ago = i < 2 ? rand(1, 23) + "時間" : rand(1, 7) + "日";
    list.appendChild(notifItem(pickNotifKind(), ago));
  }

  list.appendChild(ntSection("過去30日間"));
  var n30 = rand(6, 9);
  for (var j = 0; j < n30; j++) {
    list.appendChild(notifItem(pickNotifKind(), ntOldDate(rand(8, 30))));
  }
}

/* ================= profile ================= */
/* フォロワー数はパッと切り替えずカウントアップさせる（伸びが目で分かるように） */
var statFollowShown = null, statFollowTimer = null;
function animateFollowerStat(to) {
  var el = $("statFollowers");
  if (statFollowShown === null) { statFollowShown = to; el.textContent = fmtShort(to); return; }
  if (statFollowShown === to) { el.textContent = fmtShort(to); return; }
  clearInterval(statFollowTimer);
  var from = statFollowShown, start = Date.now(), dur = 900;
  statFollowTimer = setInterval(function () {
    var p = Math.min(1, (Date.now() - start) / dur);
    var e = 1 - Math.pow(1 - p, 3);
    statFollowShown = Math.round(from + (to - from) * e);
    el.textContent = fmtShort(statFollowShown);
    el.classList.toggle("stat-up", p < 1);
    if (p >= 1) { clearInterval(statFollowTimer); statFollowShown = to; el.classList.remove("stat-up"); }
  }, 40);
}
function updateProfileStats() {
  $("statPosts").textContent = posts.length;
  animateFollowerStat(followers);
  $("profileName").textContent = profile.name || HANDLE;
  $("pfAccount").textContent = HANDLE;
  // 直近7日の伸びを表示（数字で見えないと成長が分からない、という指摘への対応）
  var wk = growthWithin(7 * 86400000);
  var g = $("pfGrowth");
  g.hidden = wk <= 0;
  if (wk > 0) g.textContent = "↑ 過去7日間で +" + fmt(wk) + "人";
  $("profileBio1").textContent = profile.bio1;
  $("profileBio2").textContent = profile.bio2;
  var slot = $("profileAvatarSlot");
  slot.innerHTML = "";
  slot.appendChild(myAvatarEl());
}

/* プロフィール編集 */
function openProfileEdit() {
  $("peName").value = profile.name || "";
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
  profile.name = $("peName").value.trim().slice(0, 30);
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
  renderSeedPosts();
}
/* ===== フォローする人を見つけよう ===== */
function renderDiscover() {
  var row = $("pfDiscoverRow");
  row.innerHTML = "";
  DB.DISCOVER_ACCOUNTS.forEach(function (a) {
    var card = document.createElement("div");
    card.className = "pf-dc";
    var x = document.createElement("button");
    x.className = "pf-dc-x";
    x.textContent = "✕";
    x.addEventListener("click", function () { card.remove(); });
    card.appendChild(x);
    var img = document.createElement("img");
    img.className = "pf-dc-img";
    img.alt = "";
    img.src = a.icon;
    img.onerror = function () { img.replaceWith(avatarEl(a.user)); };
    card.appendChild(img);
    var nm = document.createElement("div");
    nm.className = "pf-dc-name";
    nm.textContent = a.user;
    card.appendChild(nm);
    var sub = document.createElement("div");
    sub.className = "pf-dc-sub";
    sub.textContent = "共通の友達" + a.mutual + "人";
    card.appendChild(sub);
    var btn = document.createElement("button");
    btn.className = "pf-dc-btn";
    btn.textContent = "フォロー";
    btn.addEventListener("click", function () {
      var done = btn.classList.toggle("done");
      btn.textContent = done ? "フォロー中" : "フォロー";
    });
    card.appendChild(btn);
    row.appendChild(card);
  });
}
function toggleDiscover() {
  var d = $("pfDiscover");
  if (d.hidden) { renderDiscover(); d.hidden = false; }
  else d.hidden = true;
}

/* ===== プロフィールのタブ（投稿／リール／タグ付け） ===== */
function setProfileTab(tab) {
  document.querySelectorAll(".pf-tab").forEach(function (b) {
    b.classList.toggle("active", b.dataset.pftab === tab);
  });
  var grid = $("profileGrid"), reels = $("pfReelsGrid"), tagged = $("pfTaggedGrid");
  grid.hidden = tab !== "grid";
  reels.hidden = tab !== "reels";
  tagged.hidden = tab !== "tagged";
  if (tab === "grid") renderProfileGrid();
  else if (tab === "reels") renderProfileReels();
  else renderProfileTagged();
}

/* プロフィール＞リールタブ（2列・再生回数つき） */
function renderProfileReels() {
  var g = $("pfReelsGrid");
  g.innerHTML = "";
  DB.PROFILE_REELS.forEach(function (r, i) {
    var cell = document.createElement("div");
    cell.className = "pf-reel-cell";
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = kwImg(r.kw, 360, 640, hashLock(r.seed));
    imgFallback(img, r.seed, 360, 640);
    cell.appendChild(img);
    if (i === 0) {
      var st = document.createElement("span");
      st.className = "pf-reel-star";
      st.textContent = "★";
      cell.appendChild(st);
    }
    var v = document.createElement("div");
    v.className = "ex-views";
    v.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span></span>';
    v.querySelector("span").textContent = fmtViews(r.views);
    cell.appendChild(v);
    cell.addEventListener("click", function () { switchView("reels"); });
    g.appendChild(cell);
  });
}
/* プロフィール＞タグ付けタブ（3列・複数枚アイコンつき） */
function renderProfileTagged() {
  var g = $("pfTaggedGrid");
  g.innerHTML = "";
  DB.PROFILE_TAGGED.forEach(function (t) {
    var cell = document.createElement("div");
    cell.className = "pf-tag-cell";
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = kwImg(t.kw, 400, 400, hashLock(t.seed));
    imgFallback(img, t.seed, 400, 400);
    cell.appendChild(img);
    if (t.multi) {
      var m = document.createElement("span");
      m.className = "pf-multi";
      m.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="8" y="3" width="13" height="13" rx="2.5"/><path d="M3 8v11a2.5 2.5 0 0 0 2.5 2.5H16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      cell.appendChild(m);
    }
    cell.addEventListener("click", function () { toast("タグ付けされた投稿は Coming soon 🚧"); });
    g.appendChild(cell);
  });
}

/* ===== アカウントのリセット =====
   本家の☰は設定ページへ直行するのでメニューシートは廃止したが、
   このシートだけは「取り消せない操作の確認ダイアログ」として残している。
   入口は設定ページ最下部の赤いリンク（renderSettings）。 */
function confirmResetAccount() {
  var list = $("pfMenuList");
  list.innerHTML = "";
  $("pfMenuSheet").classList.add("open");
  var msg = document.createElement("div");
  msg.className = "pm-confirm";
  msg.innerHTML = "<b>アカウントをリセットしますか？</b><p>投稿・ストーリー・DM・通知が全て消え、フォロワーが初期値（約5万人）に戻ります。元に戻せません。</p>";
  list.appendChild(msg);
  var go = document.createElement("div");
  go.className = "pf-menu-item";
  go.style.color = "#ed4956";
  go.innerHTML = '<span class="ic">🧹</span>リセットする';
  go.addEventListener("click", resetAccount);
  list.appendChild(go);
  var cancel = document.createElement("div");
  cancel.className = "pf-menu-item";
  cancel.innerHTML = '<span class="ic">↩</span>キャンセル';
  cancel.addEventListener("click", function () { $("pfMenuSheet").classList.remove("open"); });
  list.appendChild(cancel);
}
function resetAccount() {
  posts.slice().forEach(function (p) {
    dbDeleteFrom("posts", p.id);
    if (p.url) { try { URL.revokeObjectURL(p.url); } catch (e) {} }
  });
  posts.length = 0;
  myStories.slice().forEach(function (s) { dbDeleteFrom("stories", s.id); });
  myStories.length = 0;
  followers = FOLLOWERS_START;
  LS.set("followers", followers);
  growthLog = []; LS.set("growthLog", []);
  dms = []; LS.set("dms", dms);
  unreadDms = 0; LS.set("unreadDms", 0);
  unreadNotifs = 0; LS.set("unreadNotifs", 0);
  seenStories = []; LS.set("seenStories", []);
  seenMyStories = []; LS.set("seenMyStories", []);
  statFollowShown = null;
  $("pfMenuSheet").classList.remove("open");
  rerenderFeed();
  renderStories();
  updateBadges();
  updateProfileStats();
  renderProfileGrid();
  toast("アカウントをリセットしました（フォロワー " + fmt(followers) + "人）");
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
    img.addEventListener("click", function () { openPostDetail({ post: p }); });
    g.appendChild(img);
  });
}

/* ================= フォロワー一覧 ================= */
function openFollowersSheet() {
  $("followersTitle").textContent = fmtShort(followers) + " フォロワー";
  var list = $("followersList");
  list.innerHTML = "";
  // 有名人風（認証済み）が先頭
  DB.FOLLOWER_VIPS.forEach(function (nm) {
    list.appendChild(followerRow(nm, true));
  });
  var shown = 100;
  for (var i = 0; i < shown; i++) {
    var pk = weightedPersona();
    var nm2 = makeName(pick(DB.PERSONAS[pk].names));
    list.appendChild(followerRow(nm2, DB.PERSONAS[pk].verified === true));
  }
  var total = DB.FOLLOWER_VIPS.length + shown;
  var more = document.createElement("div");
  more.className = "viewers-more";
  more.textContent = "他 " + fmt(Math.max(0, followers - total)) + "人があなたをフォローしています";
  list.appendChild(more);
  $("followersSheet").classList.add("open");
}
/* ================= いいねした人一覧 =================
   フォロワー一覧と同じシートを使い回す（タイトルと中身だけ差し替え）。
   「自分を好きな人が延々スクロールできる」のがこのアプリの本体なので、
   VIP（認証済み）→ 常連ペルソナ → 残りは件数、の順で見せる。 */
var LIKER_SUBS = [
  "この投稿に「いいね！」しました",
  "あなたの投稿をいつも見ています",
  "あなたをフォローしています",
  "この投稿を保存しました",
  "友達がフォローしています",
  "通知をオンにしています"
];
function openLikersSheet(post) {
  var n = post.likesShown != null ? post.likesShown : (post._likes != null ? post._likes : 0);
  $("followersTitle").textContent = "「いいね！」" + fmt(n) + "件";
  var list = $("followersList");
  list.innerHTML = "";
  var seen = {};
  function add(nm, verified) {
    if (seen[nm]) return false;
    seen[nm] = 1;
    list.appendChild(followerRow(nm, verified, pick(LIKER_SUBS)));
    return true;
  }
  var shown = 0;
  // フィードの「いいね！: ◯◯、他」に出ている本人を必ず先頭に置く（表示の食い違いを防ぐ）
  if (post.likerTop && add(post.likerTop, false)) shown++;
  DB.FOLLOWER_VIPS.forEach(function (nm) { if (shown < n && add(nm, true)) shown++; });
  var guard = 0;
  while (shown < n && shown < 100 && guard++ < 400) {
    var pk = weightedPersona();
    if (add(makeName(pick(DB.PERSONAS[pk].names)), DB.PERSONAS[pk].verified === true)) shown++;
  }
  if (n > shown) {
    var more = document.createElement("div");
    more.className = "viewers-more";
    more.textContent = "他 " + fmt(n - shown) + "人が「いいね！」しました";
    list.appendChild(more);
  }
  $("followersSheet").classList.add("open");
}

function followerRow(name, verified, sub) {
  var row = document.createElement("div");
  row.className = "viewer-row";
  row.appendChild(linkToUser(avatarEl(name), name));
  var b = document.createElement("div");
  b.className = "vbody";
  var vn = document.createElement("div");
  vn.className = "vn";
  vn.textContent = name;
  if (verified) vn.insertAdjacentHTML("beforeend", VBADGE);
  linkToUser(vn, name);
  var subEl = document.createElement("div");
  subEl.className = "vsub";
  subEl.textContent = sub || pick(["あなたをフォローしています", "フォローバックしました", "知り合いかも", "あなたの投稿をよく見ています"]);
  b.appendChild(vn);
  b.appendChild(subEl);
  row.appendChild(b);
  var btn = document.createElement("button");
  btn.className = "follow-back-btn";
  btn.textContent = "フォロー中";
  btn.addEventListener("click", function () {
    var off = btn.classList.toggle("following-off");
    btn.textContent = off ? "フォローする" : "フォロー中";
  });
  row.appendChild(btn);
  return row;
}

/* ================= views ================= */
function switchView(name) {
  ["home", "dm", "profile", "notif", "search", "reels", "settings", "user", "detail"].forEach(function (v) {
    $("view-" + v).classList.toggle("active", v === name);
  });
  // 専用ヘッダーを持つ画面ではグローバルヘッダーを隠す
  document.querySelector(".topbar").hidden =
    (name === "profile" || name === "notif" || name === "reels" ||
     name === "settings" || name === "user" || name === "detail");
  if (name === "settings") { renderSettings(""); $("settingsSearch").value = ""; }
  if (name !== "search") exPauseAll(); // 検索タブを離れたら動画を止める
  if (name !== "reels") rlPauseAll();  // リールタブを離れたら動画を止める
  if (name === "reels") { renderReels(); }
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
  if (name === "search") {
    renderExplore(); // 自分の最新投稿を先頭に反映するため毎回組み直す
    $("exSuggest").hidden = true;
    $("exSearchInput").value = "";
  }
  if (name === "profile") {
    updateProfileStats();
    renderHighlights();
    setProfileTab("grid");
    $("pfDiscover").hidden = true;
  }
}
