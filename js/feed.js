/* feed.js — コメント生成・コメントシート・返信・フィード・投稿フロー・演出 */
"use strict";

/* ================= comments ================= */
function weightedPersona() {
  var keys = Object.keys(DB.PERSONAS);
  var total = 0;
  keys.forEach(function (k) { total += DB.PERSONAS[k].weight; });
  var r = Math.random() * total;
  for (var i = 0; i < keys.length; i++) {
    r -= DB.PERSONAS[keys[i]].weight;
    if (r <= 0) return keys[i];
  }
  return "generic";
}
function makeName(base) {
  var suffix = ["", "_", "." + rand(1, 99), rand(10, 999) + "", "_x"];
  return base + pick(suffix);
}
function buildComments() {
  var count = rand(30, 50);
  var list = [];
  for (var i = 0; i < count; i++) {
    var pk = weightedPersona();
    var p = DB.PERSONAS[pk];
    list.push({
      name: makeName(pick(p.names)),
      text: pick(p.texts),
      verified: !!p.verified,
      likes: Math.random() < 0.3 ? rand(50, 3000) : rand(2, 40),
      ai: false
    });
  }
  // プロフィール名が設定されていれば、名前入りコメントを1〜3個混ぜる（APIは使わない）
  if (profile.name) {
    var k = rand(1, 3);
    for (var m = 0; m < k; m++) {
      var pk2 = pick(["fan", "gal", "fan", "generic"]);
      var idx2 = rand(0, list.length - 1);
      list[idx2] = {
        name: makeName(pick(DB.PERSONAS[pk2].names)),
        text: pick(DB.NAME_COMMENTS).replace(/\{name\}/g, profile.name),
        verified: false,
        likes: Math.random() < 0.4 ? rand(50, 2000) : rand(2, 40),
        ai: false
      };
    }
  }
  // アンチ→擁護の小芝居を6割の確率で差し込む（順序保持）
  if (Math.random() < 0.6) {
    var drama = pick(DB.ANTI_DRAMA);
    var pos = rand(5, Math.max(6, list.length - drama.length));
    drama.forEach(function (d, j) {
      var nm = d.p === "anti" ? pick(DB.ANTI_NAMES) : makeName(pick(DB.PERSONAS[d.p === "overseas" ? "overseas" : d.p].names));
      list.splice(pos + j, 0, {
        name: nm, text: d.t, verified: false,
        likes: d.p === "anti" ? rand(0, 3) : rand(100, 2500), ai: false
      });
    });
  }
  return list;
}

function replyEl(r) {
  var div = document.createElement("div");
  div.className = "reply";
  div.appendChild(r.mine ? myAvatarEl() : avatarEl(r.name));
  var rb = document.createElement("div");
  rb.className = "rb";
  var rn = document.createElement("span");
  rn.className = "rn";
  rn.textContent = r.name;
  rb.appendChild(rn);
  if (r.mine) rn.insertAdjacentHTML("afterend", VBADGE + " ");
  rb.appendChild(document.createTextNode(r.text));
  div.appendChild(rb);
  return div;
}

/* 本人が書き込むとファンが沸く */
function fanEruption(c, post, repliesWrap) {
  var n = rand(2, 4);
  for (var j = 0; j < n; j++) {
    (function (j) {
      setTimeout(function () {
        var fan = {
          name: makeName(pick(DB.PERSONAS.fan.names.concat(DB.PERSONAS.gal.names))),
          text: pick(DB.REPLY_FAN),
          mine: false
        };
        c.replies.push(fan);
        repliesWrap.appendChild(replyEl(fan));
        if (j === n - 1) persist(post);
      }, 900 + j * rand(1000, 1800));
    })(j);
  }
}

function commentEl(c, post) {
  var div = document.createElement("div");
  div.className = "comment" + (c.ai ? " ai-comment" : "");
  div.appendChild(linkToUser(c.mine ? myAvatarEl() : avatarEl(c.name), c.name));
  var body = document.createElement("div");
  body.className = "body";
  var head = document.createElement("span");
  head.className = "cu";
  head.textContent = c.name;
  if (c.verified || c.mine) head.insertAdjacentHTML("beforeend", VBADGE);
  linkToUser(head, c.name);
  var txt = document.createElement("div");
  txt.className = "ct";
  txt.textContent = c.text;
  var meta = document.createElement("div");
  meta.className = "meta";
  var likesSpan = document.createElement("span");
  likesSpan.textContent = "いいね" + fmtShort(Math.max(1, c.likes || 1)) + "件";
  var replyBtn = document.createElement("span");
  replyBtn.textContent = "返信する";
  replyBtn.style.cursor = "pointer";
  meta.appendChild(likesSpan);
  meta.appendChild(replyBtn);
  body.appendChild(head); body.appendChild(txt); body.appendChild(meta);

  // 既存の返信を描画
  var repliesWrap = document.createElement("div");
  repliesWrap.className = "replies";
  c.replies = c.replies || [];
  c.replies.forEach(function (r) { repliesWrap.appendChild(replyEl(r)); });
  body.appendChild(repliesWrap);

  // 返信入力（開閉式）
  var inputRow = null;
  replyBtn.addEventListener("click", function () {
    if (inputRow) { inputRow.querySelector("input").focus(); return; }
    inputRow = document.createElement("div");
    inputRow.className = "reply-input-row";
    var inp = document.createElement("input");
    inp.placeholder = c.name + " さんに返信…";
    inp.maxLength = 200;
    var send = document.createElement("button");
    send.textContent = "送信";
    function doSend() {
      var t = inp.value.trim();
      if (!t) return;
      var mine = { name: HANDLE, mine: true, text: t };
      c.replies.push(mine);
      repliesWrap.appendChild(replyEl(mine));
      inp.value = "";
      c.likes = (c.likes || 0) + rand(200, 1200); // 本人返信でコメントも伸びる
      likesSpan.textContent = "いいね" + fmtShort(c.likes) + "件";
      persist(post);
      fanEruption(c, post, repliesWrap);
    }
    send.addEventListener("click", doSend);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSend(); });
    inputRow.appendChild(inp);
    inputRow.appendChild(send);
    body.appendChild(inputRow);
    inp.focus();
  });

  div.appendChild(body);
  var h = document.createElement("button");
  h.className = "cheart";
  h.textContent = "♡";
  div.appendChild(h);
  return div;
}

var sheetPost = null;
function openCommentSheet(post) {
  sheetPost = post;
  var listEl = $("commentsList");
  listEl.innerHTML = "";
  post.comments.forEach(function (c) { listEl.appendChild(commentEl(c, post)); });
  var slot = $("ciAvatarSlot");
  slot.innerHTML = "";
  slot.appendChild(myAvatarEl());
  $("commentSheet").classList.add("open");
}

/* シート下部から自分の新規コメント */
function submitOwnComment() {
  var post = sheetPost;
  if (!post) return;
  var inp = $("commentInput");
  var t = inp.value.trim();
  if (!t) return;
  inp.value = "";
  var cm = { name: HANDLE, mine: true, text: t, verified: true, likes: 0, ai: false, replies: [] };
  post.comments.push(cm);
  var listEl = $("commentsList");
  var el = commentEl(cm, post);
  listEl.appendChild(el);
  listEl.scrollTop = listEl.scrollHeight;
  var vc = document.querySelector('[data-id="' + post.id + '"] .view-comments');
  if (vc) vc.textContent = "コメント" + post.comments.length + "件をすべて見る";
  persist(post);
  fanEruption(cm, post, el.querySelector(".replies"));
}

/* ================= feed ================= */
function likesLineText(post) {
  return fmtShort(post.likesShown);
}
/* 本家準拠のアクション行（♡・💬・🔁・✈ に件数が横に付き、右端に🔖） */
var PA_ICONS = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  cmt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>',
  repost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 12.5v-2A4.5 4.5 0 0 1 8 6h12.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 11.5v2a4.5 4.5 0 0 1-4.5 4.5H3.5"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M19 21 12 16 5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/></svg>'
};
function paBtn(kind, cls, countText) {
  var b = document.createElement("button");
  b.className = "pa-btn " + cls;
  b.innerHTML = PA_ICONS[kind] + (countText !== null ? '<span class="pa-n"></span>' : "");
  if (countText !== null) b.querySelector(".pa-n").textContent = countText;
  return b;
}
/* 押すたびに数字が1つ増えるボタン（他人の投稿・広告用。保存はしない） */
function bumpCount(btn, startN, msg) {
  var n = startN;
  btn.addEventListener("click", function () {
    n += 1;
    btn.querySelector(".pa-n").textContent = fmtShort(n);
    toast(msg);
  });
}
/* いいねした人の行（「いいね！: ◯◯、他」＋小さいアバター2つ）
   タップでいいねした人の一覧が開く。代表の名前は投稿ごとに固定しないと
   再描画のたびに別人になってしまうので post に覚えさせる。 */
function likersLine(post) {
  var wrap = document.createElement("div");
  wrap.className = "likers-line";
  if (!post.likerTop) post.likerTop = makeName(pick(DB.PERSONAS[weightedPersona()].names));
  var n1 = post.likerTop;
  var a1 = avatarEl(n1), a2 = avatarEl(n1 + "b");
  wrap.appendChild(a1);
  wrap.appendChild(a2);
  var t = document.createElement("span");
  t.textContent = "いいね！: " + n1 + "、他";
  wrap.appendChild(t);
  wrap.addEventListener("click", function () { openLikersSheet(post); });
  return wrap;
}
/* 保存数・シェア数（いいね数からそれっぽい比率で算出。既存投稿にも後付けする） */
function ensureMetrics(post) {
  if (post.savesTarget == null) post.savesTarget = Math.round(post.likesTarget * (0.06 + Math.random() * 0.05));
  if (post.sharesTarget == null) post.sharesTarget = Math.round(post.likesTarget * (0.03 + Math.random() * 0.03));
  if (post.repostsTarget == null) post.repostsTarget = Math.round(post.likesTarget * (0.04 + Math.random() * 0.04));
  if (post.savesShown == null) post.savesShown = post.savesTarget;
  if (post.sharesShown == null) post.sharesShown = post.sharesTarget;
  if (post.repostsShown == null) post.repostsShown = post.repostsTarget;
}
/* 投稿直後、保存・シェア・リポスト数がカラカラ伸びる演出 */
function animateMetric(post, handles, dur) {
  var start = Date.now();
  var sv0 = post.savesShown, sh0 = post.sharesShown, rp0 = post.repostsShown;
  var iv = setInterval(function () {
    var p = Math.min(1, (Date.now() - start) / dur);
    var e = 1 - Math.pow(1 - p, 3);
    post.savesShown = Math.round(sv0 + (post.savesTarget - sv0) * e);
    post.sharesShown = Math.round(sh0 + (post.sharesTarget - sh0) * e);
    post.repostsShown = Math.round(rp0 + (post.repostsTarget - rp0) * e);
    if (handles.saveN) handles.saveN.textContent = fmtShort(post.savesShown);
    if (handles.sendN) handles.sendN.textContent = fmtShort(post.sharesShown);
    if (handles.repN) handles.repN.textContent = fmtShort(post.repostsShown);
    if (p >= 1) { clearInterval(iv); persist(post); }
  }, 80);
}
function renderPost(post, prepend) {
  var el = document.createElement("article");
  el.className = "post";
  el.dataset.id = post.id;

  var head = document.createElement("div");
  head.className = "post-head";
  head.appendChild(linkToUser(myAvatarEl(), HANDLE));
  var un = document.createElement("span");
  un.className = "uname";
  un.textContent = HANDLE;
  un.insertAdjacentHTML("beforeend", VBADGE);
  head.appendChild(linkToUser(un, HANDLE));
  var moreBtn = document.createElement("button");
  moreBtn.className = "post-more";
  moreBtn.textContent = "···";
  moreBtn.addEventListener("click", function () { openPostMenu(post); });
  head.appendChild(moreBtn);
  el.appendChild(head);

  var wrap = document.createElement("div");
  wrap.className = "post-img-wrap";
  var img = document.createElement("img");
  img.className = "post-img";
  img.src = post.url;
  img.alt = "";
  wrap.appendChild(img);
  el.appendChild(wrap);

  ensureMetrics(post);
  var actions = document.createElement("div");
  actions.className = "post-actions";
  var heartBtn = paBtn("heart", "heart-btn" + (post.myLike ? " liked" : ""), likesLineText(post));
  var cmtBtn = paBtn("cmt", "cmt-btn", fmtShort(post.comments.length));
  var repBtn = paBtn("repost", "rep-btn", fmtShort(post.repostsShown));
  var sendBtn = paBtn("send", "share2-btn", fmtShort(post.sharesShown));
  var saveBtn = paBtn("save", "save-btn" + (post.mySaved ? " saved" : ""), fmtShort(post.savesShown));
  actions.appendChild(heartBtn);
  actions.appendChild(cmtBtn);
  actions.appendChild(repBtn);
  actions.appendChild(sendBtn);
  actions.appendChild(Object.assign(document.createElement("span"), { className: "spacer" }));
  actions.appendChild(saveBtn);
  el.appendChild(actions);

  var likes = heartBtn.querySelector(".pa-n"); // いいね数はハートの横（演出はここを更新）
  el.appendChild(likersLine(post));

  var cap = document.createElement("div");
  cap.className = "caption-line";
  var u = document.createElement("span");
  u.className = "u";
  u.textContent = HANDLE;
  cap.appendChild(u);
  cap.appendChild(document.createTextNode(post.caption || ""));
  el.appendChild(cap);

  var vc = document.createElement("button");
  vc.className = "view-comments";
  vc.textContent = "コメント" + post.comments.length + "件をすべて見る";
  el.appendChild(vc);

  var ins = document.createElement("button");
  ins.className = "view-comments";
  ins.style.color = "#0095f6";
  ins.textContent = "インサイトを見る";
  el.appendChild(ins);

  var tm = document.createElement("div");
  tm.className = "post-time";
  tm.textContent = timeAgo(post.time);
  el.appendChild(tm);

  // events
  heartBtn.addEventListener("click", function () {
    post.myLike = !post.myLike;
    this.classList.toggle("liked", post.myLike);
    post.likesShown += post.myLike ? 1 : -1;
    likes.textContent = likesLineText(post);
    if (post.myLike) flyHearts(this, 3);
    persist(post);
  });
  repBtn.addEventListener("click", function () {
    post.repostsShown += 1;
    repBtn.querySelector(".pa-n").textContent = fmtShort(post.repostsShown);
    toast("リポストしました🔁");
    persist(post);
  });
  actions.querySelector(".cmt-btn").addEventListener("click", function () { openCommentSheet(post); });
  vc.addEventListener("click", function () { openCommentSheet(post); });
  ins.addEventListener("click", function () { openInsights(post); });
  sendBtn.addEventListener("click", function () {
    post.sharesShown += 1;
    sendBtn.querySelector(".pa-n").textContent = fmtShort(post.sharesShown);
    toast("シェアしました➤ 拡散されています…！");
    persist(post);
  });
  saveBtn.addEventListener("click", function () {
    post.mySaved = !post.mySaved;
    this.classList.toggle("saved", post.mySaved);
    post.savesShown += post.mySaved ? 1 : -1;
    saveBtn.querySelector(".pa-n").textContent = fmtShort(post.savesShown);
    toast(post.mySaved ? "保存しました🔖（あなたの端末の中に）" : "保存を解除しました");
    persist(post);
  });
  img.addEventListener("dblclick", function (e) {
    if (!post.myLike) heartBtn.click();
    flyHearts(img, 5, e);
  });

  var feed = $("feed");
  if (prepend && feed.firstChild) feed.insertBefore(el, feed.firstChild);
  else feed.appendChild(el);
  return {
    el: el, likesEl: likes, vcEl: vc,
    saveN: saveBtn.querySelector(".pa-n"),
    sendN: sendBtn.querySelector(".pa-n"),
    repN: repBtn.querySelector(".pa-n"),
    cmtN: cmtBtn.querySelector(".pa-n")
  };
}

/* 投稿の「···」メニュー */
var POST_MENU = [
  { ic: "🔗", label: "リンクをコピー" },
  { ic: "📤", label: "シェア..." },
  { ic: "🔖", label: "保存" },
  { ic: "📊", label: "インサイトを見る", insight: true },
  { ic: "🙈", label: "興味なし" },
  { ic: "⚠️", label: "報告する", danger: true },
  { ic: "🗑", label: "削除", danger: true, del: true }
];
function openPostMenu(post) {
  var list = $("postMenuList");
  list.innerHTML = "";
  POST_MENU.forEach(function (m) {
    if (m.del && !post) return; // 自分の投稿以外は削除を出さない
    var row = document.createElement("div");
    row.className = "pf-menu-item";
    if (m.danger) row.style.color = "#ed4956";
    var ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = m.ic;
    row.appendChild(ic);
    row.appendChild(document.createTextNode(m.label));
    row.addEventListener("click", function () {
      if (m.del) { confirmDeletePost(post); return; }
      $("postMenuSheet").classList.remove("open");
      if (m.insight && post) openInsights(post);
      else toast(m.label + "は Coming soon 🚧");
    });
    list.appendChild(row);
  });
  $("postMenuSheet").classList.add("open");
}
/* 削除は取り消せないので、必ず確認を挟む */
function confirmDeletePost(post) {
  var list = $("postMenuList");
  list.innerHTML = "";
  var msg = document.createElement("div");
  msg.className = "pm-confirm";
  msg.innerHTML = "<b>この投稿を削除しますか？</b><p>削除すると元に戻せません。いいね・コメントも消えます。</p>";
  list.appendChild(msg);
  var del = document.createElement("div");
  del.className = "pf-menu-item";
  del.style.color = "#ed4956";
  del.innerHTML = '<span class="ic">🗑</span>削除する';
  del.addEventListener("click", function () {
    deletePost(post);
    $("postMenuSheet").classList.remove("open");
  });
  list.appendChild(del);
  var cancel = document.createElement("div");
  cancel.className = "pf-menu-item";
  cancel.innerHTML = '<span class="ic">↩</span>キャンセル';
  cancel.addEventListener("click", function () { $("postMenuSheet").classList.remove("open"); });
  list.appendChild(cancel);
}
function deletePost(post) {
  var i = posts.indexOf(post);
  if (i >= 0) posts.splice(i, 1);
  dbDeleteFrom("posts", post.id);
  var el = document.querySelector('[data-id="' + post.id + '"]');
  if (el) el.remove();
  if (post.url) { try { URL.revokeObjectURL(post.url); } catch (e) {} }
  updateProfileStats();
  renderProfileGrid();
  toast("投稿を削除しました");
}

/* 投稿画面のおすすめ音源カード */
function renderMusicCards() {
  var wrap = $("cnMusicCards");
  if (!wrap) return;
  wrap.innerHTML = "";
  DB.MUSIC_SUGGESTIONS.forEach(function (m) {
    var b = document.createElement("button");
    b.className = "cn-music-card";
    var im = document.createElement("img");
    im.alt = "";
    im.src = m.art;
    var sp = document.createElement("span");
    sp.textContent = "↗ " + m.title;
    b.appendChild(im);
    b.appendChild(sp);
    b.addEventListener("click", function () { toast("音源の追加は Coming soon 🚧"); });
    wrap.appendChild(b);
  });
  // 編集画面の上部に出るおすすめ音源
  var top = DB.MUSIC_TOP;
  if ($("ceMusicTitle")) {
    $("ceMusicTitle").textContent = top.title;
    $("ceMusicSub").textContent = top.sub;
    $("ceMusicArt").src = top.art;
  }
}

/* コメント欄の絵文字クイックバー */
var CI_EMOJI = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];
function renderCommentEmoji() {
  var wrap = $("ciEmoji");
  wrap.innerHTML = "";
  CI_EMOJI.forEach(function (e) {
    var b = document.createElement("button");
    b.textContent = e;
    b.addEventListener("click", function () {
      var inp = $("commentInput");
      inp.value += e;
      inp.focus();
    });
    wrap.appendChild(b);
  });
}

function flyHearts(anchor, n, evt) {
  var r = anchor.getBoundingClientRect();
  for (var i = 0; i < n; i++) {
    (function (i) {
      setTimeout(function () {
        var h = document.createElement("span");
        h.className = "fly-heart";
        h.textContent = "❤️";
        var x = evt ? evt.clientX : r.left + r.width / 2;
        var y = evt ? evt.clientY : r.top;
        h.style.left = (x + rand(-30, 30)) + "px";
        h.style.top = (y + rand(-10, 10)) + "px";
        document.body.appendChild(h);
        setTimeout(function () { h.remove(); }, 1400);
      }, i * 120);
    })(i);
  }
}

function persist(post) {
  dbPut({
    id: post.id, blob: post.blob, caption: post.caption,
    likesTarget: post.likesTarget, likesShown: post.likesShown,
    savesTarget: post.savesTarget, savesShown: post.savesShown,
    sharesTarget: post.sharesTarget, sharesShown: post.sharesShown,
    repostsTarget: post.repostsTarget, repostsShown: post.repostsShown, mySaved: post.mySaved,
    comments: post.comments, time: post.time, buzz: post.buzz, myLike: post.myLike
  }).catch(function () {});
}

/* ================= 公式/他人の投稿（シード。API不使用の張りぼて） ================= */
function seedAvatar(sp) {
  var d = document.createElement("div");
  d.className = "avatar";
  d.style.background = "transparent";
  var img = document.createElement("img");
  img.className = "face-img";
  img.alt = "";
  img.src = sp.icon;
  img.onerror = function () { d.replaceWith(avatarEl(sp.user)); };
  d.appendChild(img);
  return d;
}
/* 自分の一番伸びた投稿を基準値にする（未投稿なら控えめな既定値） */
function seedReference() {
  var best = 0;
  posts.forEach(function (p) { best = Math.max(best, p.likesTarget || p.likesShown || 0); });
  return best > 0 ? best : 4200;
}
/* 基準値が変わった時だけ数字を引き直す（同一セッションでは表示を安定させる） */
function seedNumbers(sp, ref) {
  if (sp._ref !== ref) {
    sp._ref = ref;
    sp._likes = Math.max(120, Math.round(ref * sp.ratio * (0.92 + Math.random() * 0.16)));
    sp._cmt = Math.max(3, Math.round(sp._likes * 0.019));
  }
  return sp;
}
function renderSeedPost(sp, ref) {
  seedNumbers(sp, ref === undefined ? seedReference() : ref);
  var el = document.createElement("article");
  el.className = "post";

  var head = document.createElement("div");
  head.className = "post-head";
  head.appendChild(linkToUser(seedAvatar(sp), sp.user));
  var un = document.createElement("span");
  un.className = "uname";
  un.textContent = sp.user;
  if (sp.verified) un.insertAdjacentHTML("beforeend", VBADGE);
  head.appendChild(linkToUser(un, sp.user));
  el.appendChild(head);

  var wrap = document.createElement("div");
  wrap.className = "post-img-wrap";
  var img = document.createElement("img");
  img.className = "post-img";
  img.alt = "";
  img.src = kwImg(sp.kw, 800, 800, hashLock(sp.seed));
  imgFallback(img, sp.seed, 800, 800);
  wrap.appendChild(img);
  el.appendChild(wrap);

  var state = { n: sp._likes, liked: false };
  var actions = document.createElement("div");
  actions.className = "post-actions";
  var heartBtn = paBtn("heart", "heart-btn", fmtShort(state.n));
  var cmtBtn = paBtn("cmt", "cmt-btn", fmtShort(sp._cmt));
  var repBtn = paBtn("repost", "rep-btn", fmtShort(Math.round(sp._likes * 0.06)));
  var sendBtn = paBtn("send", "share2-btn", fmtShort(Math.round(sp._likes * 0.04)));
  var saveBtn = paBtn("save", "save-btn", fmtShort(Math.round(sp._likes * 0.08)));
  actions.appendChild(heartBtn);
  actions.appendChild(cmtBtn);
  actions.appendChild(repBtn);
  actions.appendChild(sendBtn);
  actions.appendChild(Object.assign(document.createElement("span"), { className: "spacer" }));
  actions.appendChild(saveBtn);
  el.appendChild(actions);

  var likes = heartBtn.querySelector(".pa-n");
  el.appendChild(likersLine(sp));

  var cap = document.createElement("div");
  cap.className = "caption-line";
  var u = document.createElement("span");
  u.className = "u";
  u.textContent = sp.user;
  cap.appendChild(u);
  cap.appendChild(document.createTextNode(sp.caption));
  el.appendChild(cap);

  var vc = document.createElement("button");
  vc.className = "view-comments";
  vc.textContent = "コメント" + fmt(sp._cmt) + "件をすべて見る";
  el.appendChild(vc);

  var tm = document.createElement("div");
  tm.className = "post-time";
  tm.textContent = rand(1, 6) + "日前";
  el.appendChild(tm);

  heartBtn.addEventListener("click", function () {
    state.liked = !state.liked;
    this.classList.toggle("liked", state.liked);
    state.n += state.liked ? 1 : -1;
    likes.textContent = fmtShort(state.n);
    if (state.liked) flyHearts(this, 3);
  });
  cmtBtn.addEventListener("click", function () { toast("コメントは Coming soon 🚧"); });
  vc.addEventListener("click", function () { toast("コメントは Coming soon 🚧"); });
  bumpCount(repBtn, Math.round(sp._likes * 0.06), "リポストしました🔁");
  bumpCount(sendBtn, Math.round(sp._likes * 0.04), "シェアしました➤");
  saveBtn.addEventListener("click", function () {
    var on = this.classList.toggle("saved");
    toast(on ? "保存しました🔖" : "保存を解除しました");
  });
  img.addEventListener("dblclick", function (e) {
    if (!state.liked) heartBtn.click();
    flyHearts(img, 5, e);
  });

  $("feed").appendChild(el);
}
/* ===== 広告投稿（本家準拠: 広告ラベル・フォローボタン・CTAバー・翻訳を見る） ===== */
function renderAdPost(ad) {
  var el = document.createElement("article");
  el.className = "post";

  var head = document.createElement("div");
  head.className = "post-head ad-head";
  head.appendChild(linkToUser(seedAvatar(ad), ad.user));
  var hb = document.createElement("div");
  hb.className = "ad-head-body";
  var un = document.createElement("div");
  un.className = "uname";
  un.textContent = ad.user;
  linkToUser(un, ad.user);
  var lb = document.createElement("div");
  lb.className = "ad-label";
  lb.textContent = "広告";
  hb.appendChild(un);
  hb.appendChild(lb);
  head.appendChild(hb);
  var fb = document.createElement("button");
  fb.className = "ad-follow";
  fb.textContent = "フォロー";
  fb.addEventListener("click", function () {
    var done = fb.classList.toggle("done");
    fb.textContent = done ? "フォロー中" : "フォロー";
  });
  head.appendChild(fb);
  var more = document.createElement("button");
  more.className = "ad-more";
  more.textContent = "···";
  more.addEventListener("click", function () { toast("この広告を非表示は Coming soon 🚧"); });
  head.appendChild(more);
  el.appendChild(head);

  var wrap = document.createElement("div");
  wrap.className = "post-img-wrap";
  var img = document.createElement("img");
  img.className = "post-img";
  img.alt = "";
  img.loading = "lazy";
  img.src = kwImg(ad.kw, 800, 800, hashLock(ad.seed));
  imgFallback(img, ad.seed, 800, 800);
  wrap.appendChild(img);
  el.appendChild(wrap);

  // CTAバー（「詳細を見る ›」）
  var cta = document.createElement("button");
  cta.className = "ad-cta";
  cta.innerHTML = "<span></span><span class='ad-cta-chev'>›</span>";
  cta.querySelector("span").textContent = ad.cta;
  cta.addEventListener("click", function () { toast("リンク先は Coming soon 🚧"); });
  el.appendChild(cta);

  var state = { n: ad.likes, liked: false };
  var actions = document.createElement("div");
  actions.className = "post-actions";
  var heartBtn = paBtn("heart", "heart-btn", fmtShort(state.n));
  var cmtBtn = paBtn("cmt", "cmt-btn", fmtShort(ad.cmt));
  var repBtn = paBtn("repost", "rep-btn", fmtShort(ad.rep));
  var sendBtn = paBtn("send", "share2-btn", fmtShort(ad.send));
  var saveBtn = paBtn("save", "save-btn", null);
  actions.appendChild(heartBtn);
  actions.appendChild(cmtBtn);
  actions.appendChild(repBtn);
  actions.appendChild(sendBtn);
  actions.appendChild(Object.assign(document.createElement("span"), { className: "spacer" }));
  actions.appendChild(saveBtn);
  el.appendChild(actions);

  var cap = document.createElement("div");
  cap.className = "caption-line";
  var u = document.createElement("span");
  u.className = "u";
  u.textContent = ad.user;
  cap.appendChild(u);
  cap.appendChild(document.createTextNode(ad.caption));
  el.appendChild(cap);

  var tr = document.createElement("button");
  tr.className = "view-comments";
  tr.textContent = "翻訳を見る";
  tr.addEventListener("click", function () { toast("翻訳は Coming soon 🚧"); });
  el.appendChild(tr);

  var fbk = document.createElement("div");
  fbk.className = "ad-feedback";
  var ft = document.createElement("span");
  ft.textContent = "同じような広告の表示が多すぎますか？";
  var fx = document.createElement("button");
  fx.textContent = "✕";
  fx.addEventListener("click", function () { fbk.remove(); });
  fbk.appendChild(ft);
  fbk.appendChild(fx);
  el.appendChild(fbk);

  heartBtn.addEventListener("click", function () {
    state.liked = !state.liked;
    this.classList.toggle("liked", state.liked);
    state.n += state.liked ? 1 : -1;
    heartBtn.querySelector(".pa-n").textContent = fmtShort(state.n);
    if (state.liked) flyHearts(this, 3);
  });
  cmtBtn.addEventListener("click", function () { toast("コメントは Coming soon 🚧"); });
  bumpCount(repBtn, ad.rep, "リポストしました🔁");
  bumpCount(sendBtn, ad.send, "シェアしました➤");
  saveBtn.addEventListener("click", function () {
    var on = this.classList.toggle("saved");
    toast(on ? "保存しました🔖" : "保存を解除しました");
  });

  $("feed").appendChild(el);
}

function renderSeedPosts() {
  var ref = seedReference(); // 自分の投稿を基準に、シードの数字を毎回スケールさせる
  DB.SEED_POSTS.forEach(function (sp, i) {
    renderSeedPost(sp, ref);
    // 本家同様、2件おきに広告を挟む
    if (i % 2 === 1 && DB.AD_POSTS[(i - 1) / 2]) renderAdPost(DB.AD_POSTS[(i - 1) / 2]);
  });
}

/* ================= insights ================= */
function openInsights(post) {
  var L = post.likesTarget;
  var rows = [
    ["リーチしたアカウント数", Math.round(L * (3.2 + Math.random())), 1],
    ["インプレッション", Math.round(L * (5.5 + Math.random() * 2)), 1],
    ["いいね", post.likesShown, 0.6],
    ["保存数", Math.round(L * 0.09), 0.35],
    ["プロフィールへのアクセス", Math.round(L * 0.14), 0.4],
    ["この投稿からのフォロー", Math.round(L * 0.02), 0.25]
  ];
  var body = $("insightBody");
  body.innerHTML = "<h3>この投稿のパフォーマンス 🚀</h3>";
  rows.forEach(function (r) {
    var d = document.createElement("div");
    d.className = "bar-row";
    d.innerHTML = '<div class="bl"><span>' + r[0] + '</span><b>' + fmt(r[1]) + '</b></div><div class="bar"><i></i></div>';
    body.appendChild(d);
  });
  // フォロワーの伸びも見せる（成長が数字で分かるように）
  var wk = growthWithin(7 * 86400000), day = growthWithin(86400000);
  var gw = document.createElement("div");
  gw.className = "insight-growth";
  gw.innerHTML =
    '<div><span>過去24時間</span><b>+' + fmt(day) + '</b></div>' +
    '<div><span>過去7日間</span><b>+' + fmt(wk) + '</b></div>' +
    '<div><span>フォロワー</span><b>' + fmt(followers) + '</b></div>';
  body.appendChild(gw);

  var note = document.createElement("p");
  note.className = "insight-note";
  note.textContent = "同カテゴリのインフルエンサー上位1%のパフォーマンスです（当社比）";
  body.appendChild(note);
  $("insightSheet").classList.add("open");
  setTimeout(function () {
    body.querySelectorAll(".bar i").forEach(function (bar, i) {
      bar.style.width = Math.round(rows[i][2] * 100) + "%";
    });
  }, 60);
}

/* ================= the show（投稿後の演出） ================= */
/* いいね数はフォロワー数に連動する（育成ループの片側）。
   固定値だと「育てた実感」が出ないため、フォロワーの◯%で算出する。 */
function rollBuzz() {
  var f = Math.max(1000, followers);
  var r = Math.random();
  function pct(lo, hi) { return Math.round(f * (lo + Math.random() * (hi - lo))); }
  if (r < 0.06) return { level: 2, likes: pct(2.0, 6.0) };   // 大バズ: フォロワーの200〜600%
  if (r < 0.30) return { level: 1, likes: pct(0.20, 0.60) }; // 中バズ: 20〜60%
  return { level: 0, likes: pct(0.02, 0.08) };               // 通常: 2〜8%
}

function animateLikes(post, likesEl, duration) {
  // rAFはバックグラウンドタブで止まるので、時刻ベースのintervalで確実に完走させる
  var start = Date.now();
  var timer = setInterval(function () {
    var t = Math.min(1, (Date.now() - start) / duration);
    var eased = 1 - Math.pow(1 - t, 3);
    post.likesShown = Math.round(post.likesTarget * eased);
    likesEl.textContent = likesLineText(post);
    if (t >= 1) {
      clearInterval(timer);
      persist(post);
    }
  }, 60);
}

/* 獲得したいいね数の一部がフォロワーに変わる（育成ループのもう片側）。
   フォロワーが増えるほど変換率を落として、数字が爆発しないようにしている。 */
function followerConversion() {
  if (followers < 100000) return 0.16;
  if (followers < 500000) return 0.10;
  if (followers < 2000000) return 0.06;
  if (followers < 10000000) return 0.035;
  return 0.02;
}
function followerRush(buzzLevel, totalLikes) {
  var times = buzzLevel === 2 ? 5 : buzzLevel === 1 ? 3 : 2;
  var total = Math.round(totalLikes * followerConversion() * (0.85 + Math.random() * 0.3));
  for (var i = 0; i < times; i++) {
    (function (i) {
      setTimeout(function () {
        // 合計を回数で割って、少しばらけさせながら増やす
        var gain = Math.max(1, Math.round(total / times * (0.7 + Math.random() * 0.6)));
        addFollowers(gain, "");
      }, 2500 + i * 3600);
    })(i);
  }
}

function scheduleDm(buzzLevel) {
  var delay = rand(8000, 18000);
  setTimeout(function () {
    var c = pick(DB.DM_COMPANIES);
    dms.unshift({ name: c.name, msg: c.msg, time: Date.now() });
    unreadDms++;
    LS.set("dms", dms); LS.set("unreadDms", unreadDms);
    updateBadges();
    banner("📩", c.name, "PRのご相談が届きました");
    if (buzzLevel === 2) {
      setTimeout(function () {
        var c2 = pick(DB.DM_COMPANIES.filter(function (x) { return x.name !== c.name; }));
        dms.unshift({ name: c2.name, msg: c2.msg, time: Date.now() });
        unreadDms++;
        LS.set("dms", dms); LS.set("unreadDms", unreadDms);
        updateBadges();
        banner("📩", c2.name, "アンバサダー契約のご相談が届きました");
      }, 6000);
    }
  }, delay);
  schedulePeopleDm(buzzLevel);
}

/* 一般の人からのDM（企業案件だけだと不自然なので混ぜる） */
function schedulePeopleDm(buzzLevel) {
  var count = buzzLevel === 2 ? rand(2, 4) : buzzLevel === 1 ? rand(1, 3) : rand(0, 2);
  for (var i = 0; i < count; i++) {
    (function (i) {
      setTimeout(function () {
        var pk = weightedPersona();
        var nm = makeName(pick(DB.PERSONAS[pk].names));
        dms.unshift({ name: nm, msg: pick(DB.DM_PEOPLE), time: Date.now(), person: true });
        unreadDms++;
        LS.set("dms", dms); LS.set("unreadDms", unreadDms);
        updateBadges();
        banner("💬", nm, "メッセージが届きました");
      }, rand(12000, 40000) + i * rand(5000, 12000));
    })(i);
  }
}

function burstComments(post, handles) {
  var i = 0;
  var listEl = $("commentsList");
  function next() {
    if (i >= post.comments.length) { persist(post); return; }
    var c = post.comments[i];
    if ($("commentSheet").classList.contains("open") && sheetPost === post) {
      listEl.appendChild(commentEl(c, post));
      listEl.scrollTop = listEl.scrollHeight;
    }
    i++;
    handles.vcEl.textContent = "コメント" + i + "件をすべて見る";
    setTimeout(next, rand(60, 160));
  }
  next();
}

function fetchAiComments(post, handles) {
  blobToResizedBase64(post.blob, 768, 0.8).then(function (b64) {
    return fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: b64.data, mime: b64.mime, caption: post.caption })
    });
  }).then(function (r) {
    if (!r.ok) throw new Error("api " + r.status);
    return r.json();
  }).then(function (data) {
    var arr = (data && data.comments) || [];
    if (!arr.length) return;
    toast("✨ 写真を見たフォロワーからコメントが届き始めました");
    arr.forEach(function (c, j) {
      setTimeout(function () {
        var cm = {
          name: String(c.name || "fan_" + rand(1, 999)).slice(0, 30),
          text: String(c.text || "").slice(0, 200),
          verified: false, likes: rand(20, 1500), ai: true
        };
        post.comments.push(cm);
        if ($("commentSheet").classList.contains("open") && sheetPost === post) {
          var listEl = $("commentsList");
          listEl.appendChild(commentEl(cm, post));
          listEl.scrollTop = listEl.scrollHeight;
        }
        handles.vcEl.textContent = "コメント" + post.comments.length + "件をすべて見る";
        if (j === arr.length - 1) persist(post);
      }, 800 + j * rand(900, 1600));
    });
  }).catch(function () {
    // ローカル実行や未設定時は静かにテンプレのみで続行
  });
}

/* ================= compose flow ================= */
var pendingFile = null;
var pendingUrl = null;

function openCompose(file) {
  pendingFile = file;
  if (pendingUrl) URL.revokeObjectURL(pendingUrl);
  pendingUrl = URL.createObjectURL(file);
  $("previewImg").src = pendingUrl;
  $("previewThumb").src = pendingUrl;
  $("captionInput").value = "";
  renderTmplChips();
  $("cmStep1").hidden = false;
  $("cmStep2").hidden = true;
  $("composeModal").classList.add("open");
}

function renderTmplChips(aiCaptions) {
  var row = $("tmplRow");
  row.innerHTML = "";
  var picks = [];
  if (aiCaptions) {
    picks = aiCaptions.map(function (t) { return { t: t, ai: true }; });
  } else {
    var pool = DB.CAPTION_TMPL.slice();
    for (var i = 0; i < 4; i++) picks.push({ t: pool.splice(Math.floor(Math.random() * pool.length), 1)[0] });
  }
  picks.forEach(function (p) {
    var c = document.createElement("button");
    c.className = "chip" + (p.ai ? " ai" : "");
    c.textContent = p.t;
    c.addEventListener("click", function () { $("captionInput").value = p.t; });
    row.appendChild(c);
  });
  var aiChip = document.createElement("button");
  aiChip.className = "chip ai";
  aiChip.textContent = "✨ AIに提案してもらう";
  aiChip.addEventListener("click", function () {
    aiChip.textContent = "✨ 考え中…";
    blobToResizedBase64(pendingFile, 640, 0.75).then(function (b64) {
      return fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64.data, mime: b64.mime })
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("api " + r.status);
      return r.json();
    }).then(function (d) {
      if (d && d.captions && d.captions.length) renderTmplChips(d.captions.slice(0, 3));
      else throw new Error("empty");
    }).catch(function () {
      aiChip.textContent = "✨ AI提案（Web公開版で使えます）";
      toast("AI提案はWeb公開版（API設定後）で使えます");
    });
  });
  row.appendChild(aiChip);
}

function share() {
  if (!pendingFile) return;
  var caption = $("captionInput").value.trim();
  var aiOn = $("aiToggle").checked;
  $("composeModal").classList.remove("open");
  toast("投稿中…");

  fileToResizedBlob(pendingFile, 1080, 0.85).then(function (blob) {
    var buzz = rollBuzz();
    var post = {
      id: Date.now() + "-" + rand(100, 999),
      blob: blob,
      url: URL.createObjectURL(blob),
      caption: caption,
      likesTarget: buzz.likes,
      likesShown: 0,
      savesTarget: Math.round(buzz.likes * (0.06 + Math.random() * 0.05)),
      sharesTarget: Math.round(buzz.likes * (0.03 + Math.random() * 0.03)),
      savesShown: 0,
      sharesShown: 0,
      comments: buildComments(),
      time: Date.now(),
      buzz: buzz.level,
      myLike: false,
      mySaved: false
    };
    posts.unshift(post);
    switchView("home");
    window.scrollTo({ top: 0 });
    var handles = renderPost(post, true);
    handles.vcEl.textContent = "コメント0件";
    persist(post);
    updateProfileStats();

    // ===== 演出開始 =====
    animateLikes(post, handles.likesEl, buzz.level === 2 ? 6000 : 4000);
    flyHearts(handles.el.querySelector(".post-img"), buzz.level === 2 ? 14 : 8);
    setTimeout(function () { animateMetric(post, handles, buzz.level === 2 ? 5000 : 3500); }, 1200);
    setTimeout(function () {
      banner("🔖", BRAND, fmt(post.savesTarget) + "人があなたの投稿を保存しました");
    }, 4600);
    setTimeout(function () { burstComments(post, handles); }, 900);
    followerRush(buzz.level, buzz.likes);
    scheduleDm(buzz.level);
    unreadNotifs += rand(25, 80) * (buzz.level === 2 ? 3 : 1);
    LS.set("unreadNotifs", unreadNotifs);
    updateBadges();
    if (aiOn) fetchAiComments(post, handles);
    if (buzz.level === 2) {
      setTimeout(function () {
        $("buzzText").textContent = pick(DB.BUZZ_TEXTS);
        $("buzzOverlay").classList.add("show");
      }, 2600);
    } else if (buzz.level === 1) {
      setTimeout(function () {
        banner("🚀", BRAND, pick(DB.BUZZ_TEXTS));
      }, 3000);
    }
  }).catch(function (e) {
    toast("画像の読み込みに失敗しました: " + e.message);
  });
  pendingFile = null;
}
