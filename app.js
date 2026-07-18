/*
 * Kusostagram（仮名） — インフルエンサー気分になれるクソインスタグラム
 * 写真は IndexedDB（端末内）にのみ保存。外部送信は「AIコメントON」の時に
 * /api 経由で Gemini に送る1回だけ。
 */
(function () {
  "use strict";

  var DB = window.KUSO_DB;
  var BRAND = "Shoninyokkyugram";       // 表示名（承認欲求グラム）
  var HANDLE = "watashi__official";     // 自分のアカウント名

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
      req.onsuccess = function () { idb = req.result; resolve(); };
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

  /* ================= stories ================= */
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
      var nm = makeName(pick(DB.PERSONAS[pk].names));
      list.appendChild(viewerRow(nm, false, rand(1, 59) + "分前"));
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
    div.appendChild(c.mine ? myAvatarEl() : avatarEl(c.name));
    var body = document.createElement("div");
    body.className = "body";
    var head = document.createElement("span");
    head.className = "cu";
    head.textContent = c.name;
    if (c.verified || c.mine) head.insertAdjacentHTML("beforeend", VBADGE);
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
    return "いいね！" + fmt(post.likesShown) + "件";
  }
  function renderPost(post, prepend) {
    var el = document.createElement("article");
    el.className = "post";
    el.dataset.id = post.id;

    var head = document.createElement("div");
    head.className = "post-head";
    head.appendChild(myAvatarEl());
    var un = document.createElement("span");
    un.className = "uname";
    un.textContent = HANDLE;
    un.insertAdjacentHTML("beforeend", VBADGE);
    head.appendChild(un);
    el.appendChild(head);

    var wrap = document.createElement("div");
    wrap.className = "post-img-wrap";
    var img = document.createElement("img");
    img.className = "post-img";
    img.src = post.url;
    img.alt = "";
    wrap.appendChild(img);
    el.appendChild(wrap);

    var actions = document.createElement("div");
    actions.className = "post-actions";
    actions.innerHTML =
      '<button class="icon-btn heart-btn' + (post.myLike ? " liked" : "") + '" aria-label="いいね"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>' +
      '<button class="icon-btn cmt-btn" aria-label="コメント"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg></button>' +
      '<button class="icon-btn share2-btn" aria-label="シェア"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button>' +
      '<span class="spacer"></span>' +
      '<button class="icon-btn save-btn" aria-label="保存"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M19 21 12 16 5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/></svg></button>';
    el.appendChild(actions);

    var likes = document.createElement("div");
    likes.className = "likes-line";
    likes.textContent = likesLineText(post);
    el.appendChild(likes);

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
    actions.querySelector(".heart-btn").addEventListener("click", function () {
      post.myLike = !post.myLike;
      this.classList.toggle("liked", post.myLike);
      post.likesShown += post.myLike ? 1 : -1;
      likes.textContent = likesLineText(post);
      if (post.myLike) flyHearts(this, 3);
      persist(post);
    });
    actions.querySelector(".cmt-btn").addEventListener("click", function () { openCommentSheet(post); });
    vc.addEventListener("click", function () { openCommentSheet(post); });
    ins.addEventListener("click", function () { openInsights(post); });
    actions.querySelector(".share2-btn").addEventListener("click", function () { toast("シェアは Coming soon 🚧"); });
    actions.querySelector(".save-btn").addEventListener("click", function () { toast("保存しました（あなたの端末の中に）"); });
    img.addEventListener("dblclick", function (e) {
      if (!post.myLike) actions.querySelector(".heart-btn").click();
      flyHearts(img, 5, e);
    });

    var feed = $("feed");
    if (prepend && feed.firstChild) feed.insertBefore(el, feed.firstChild);
    else feed.appendChild(el);
    return { el: el, likesEl: likes, vcEl: vc };
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
      comments: post.comments, time: post.time, buzz: post.buzz, myLike: post.myLike
    }).catch(function () {});
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
  function rollBuzz() {
    var r = Math.random();
    if (r < 0.06) return { level: 2, likes: rand(500000, 2000000) };   // 大バズ
    if (r < 0.30) return { level: 1, likes: rand(30000, 200000) };     // 中バズ
    return { level: 0, likes: rand(3000, 30000) };
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

  function followerRush(buzzLevel) {
    var times = buzzLevel === 2 ? 5 : buzzLevel === 1 ? 3 : 2;
    for (var i = 0; i < times; i++) {
      (function (i) {
        setTimeout(function () {
          var gain = rand(300, 2200) * (buzzLevel === 2 ? 8 : buzzLevel === 1 ? 3 : 1);
          followers += gain;
          LS.set("followers", followers);
          toast("フォロワー +" + fmt(gain) + "人 🎉");
          updateProfileStats();
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
        comments: buildComments(),
        time: Date.now(),
        buzz: buzz.level,
        myLike: false
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
      setTimeout(function () { burstComments(post, handles); }, 900);
      followerRush(buzz.level);
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
})();
