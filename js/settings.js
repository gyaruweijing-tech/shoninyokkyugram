/* settings.js — 設定とアクティビティ（本家完コピ）
   読み込み順: … → reels.js → settings.js → main.js */
"use strict";

/* 本家の細線アイコンに寄せたSVG。似た用途のものは使い回す */
var ST_ICONS = (function () {
  function s(inner, fill) {
    return '<svg viewBox="0 0 24 24" fill="' + (fill || "none") +
      '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  return {
    person:     s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a6 6 0 0 1 11 0"/>'),
    bookmark:   s('<path d="M19 21 12 16 5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/>'),
    archive:    s('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>'),
    chart:      s('<path d="M3 20h18"/><path d="m5 15 4-5 3 3 5-7"/><rect x="3" y="3" width="18" height="18" rx="3"/>'),
    bell:       s('<path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    clock:      s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    tablet:     s('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    lock:       s('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    star:       s('<circle cx="12" cy="12" r="9"/><path d="m12 7.5 1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4L7 11.2l3.4-.5z"/>'),
    gridplus:   s('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 3v7M14 6.5h7"/>'),
    ban:        s('<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>'),
    people:     s('<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c0-3 2.4-4.8 5.5-4.8s5.5 1.8 5.5 4.8"/><path d="M16 6.5a3 3 0 0 1 0 6"/><path d="M17.5 14.5c2 .6 3.2 2.1 3.2 4.5"/>'),
    message:   s('<circle cx="12" cy="12" r="9"/><path d="m7 13.5 3-3.5 2.5 2 3.5-3.5-3 8-2.5-2.5z"/>'),
    at:         s('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 5-2.2A9 9 0 1 0 16.5 19"/>'),
    comment:    s('<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>'),
    repost:     s('<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 12.5v-2A4.5 4.5 0 0 1 8 6h12.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 11.5v2a4.5 4.5 0 0 1-4.5 4.5H3.5"/>'),
    face:       s('<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>'),
    warn:       s('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16h.01"/>'),
    aa:         s('<path d="M3 18 7 6l4 12"/><path d="M4.4 14.5h5.2"/><path d="M20.5 11.5a3 3 0 0 0-6 0"/><path d="M20.5 11.5V18"/><path d="M20.5 15.5a3.2 3.2 0 1 1-3.2 3.2"/>'),
    personplus: s('<circle cx="10" cy="8" r="3.6"/><path d="M3 19c0-3.3 3-5.2 7-5.2 1 0 2 .1 2.8.4"/><path d="M18 14v6M15 17h6"/>'),
    play:       s('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10.5 9 5 3-5 3z"/>'),
    heartban:   s('<path d="M20.8 5.6a5 5 0 0 0-7.3-.5L12 6.4l-1.5-1.3a5 5 0 0 0-7 7l1 1L12 20l4.5-4.4"/><path d="m4 4 16 16"/>'),
    download:   s('<path d="M12 3v11"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M4 20h16"/>'),
    access:     s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.2"/><path d="M8 10.5h8"/><path d="M12 10.5V15l-2.5 3.5M12 15l2.5 3.5"/>'),
    translate:  s('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M6.5 8h6"/><path d="M9.5 8v-1.5"/><path d="M11 8c0 3-2 5.5-4.5 6.5"/><path d="M8 11.5c1 1.8 2.5 2.8 4 3.3"/><path d="m13 18 2.5-6 2.5 6"/><path d="M13.8 16h3.4"/>'),
    laptop:     s('<rect x="3" y="5" width="14" height="10" rx="2"/><path d="M2 19h16"/><path d="M19 9h3v10h-3z"/>'),
    badge:      s('<path d="M12 3l2.2 2.2 3-.4.4 3L20 10l-1.3 2.7 1.3 2.7-2.4 2.2-.4 3-3-.4L12 22l-2.2-2.2-3 .4-.4-3L4 15.4 5.3 12.7 4 10l2.4-2.2.4-3 3 .4z"/><path d="m9.5 12.3 1.8 1.8 3.3-3.6"/>'),
    receipt:    s('<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z"/><path d="M9 8h6M9 12h6"/>'),
    help:       s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="m5.7 5.7 3.9 3.9M14.4 14.4l3.9 3.9M18.3 5.7l-3.9 3.9M9.6 14.4l-3.9 3.9"/>'),
    sparkle:    s('<circle cx="7" cy="8" r="2.2"/><circle cx="14" cy="5.5" r="1.6"/><circle cx="17.5" cy="11" r="2.2"/><circle cx="10" cy="15" r="1.8"/><circle cx="15" cy="18.5" r="1.5"/>'),
    shield:     s('<path d="M12 3 5 6v5.5c0 4 3 7.6 7 9.5 4-1.9 7-5.5 7-9.5V6z"/><path d="m12 8 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z"/>'),
    info:       s('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>'),
    infinity:   s('<path d="M8 9a3 3 0 1 0 0 6c2.5 0 3.5-6 6-6a3 3 0 1 1 0 6c-2.5 0-3.5-6-6-6z"/>')
  };
})();

function stItemEl(item) {
  if (item.link) {
    var link = document.createElement("div");
    link.className = "st-link " + item.link;
    link.textContent = item.label;
    link.addEventListener("click", function () { toast(item.label + "は Coming soon 🚧"); });
    return link;
  }
  var row = document.createElement("div");
  row.className = "st-item";

  var ic = document.createElement("span");
  ic.className = "st-ic";
  ic.innerHTML = ST_ICONS[item.ic] || ST_ICONS.info;
  row.appendChild(ic);

  var body = document.createElement("div");
  body.className = "st-item-body";
  var lb = document.createElement("div");
  lb.className = "st-label";
  lb.textContent = item.label;
  body.appendChild(lb);
  if (item.sub) {
    var sb = document.createElement("div");
    sb.className = "st-sub";
    sb.textContent = item.sub;
    body.appendChild(sb);
  }
  row.appendChild(body);

  if (item.value) {
    var v = document.createElement("span");
    v.className = "st-value";
    v.textContent = item.value;
    row.appendChild(v);
  }
  var ch = document.createElement("span");
  ch.className = "st-chev";
  ch.textContent = "›";
  row.appendChild(ch);

  row.addEventListener("click", function () {
    // 「アクティビティ」だけは実際の画面へ飛ばす
    if (item.label === "アクティビティ") switchView("notif");
    else toast(item.label + "は Coming soon 🚧");
  });
  return row;
}

function renderSettings(filter) {
  var list = $("settingsList");
  list.innerHTML = "";
  var q = (filter || "").trim();
  DB.SETTINGS_SECTIONS.forEach(function (sec) {
    var items = q
      ? sec.items.filter(function (it) { return it.label.indexOf(q) >= 0; })
      : sec.items;
    if (!items.length) return;

    var wrap = document.createElement("div");
    wrap.className = "st-section";
    var head = document.createElement("div");
    head.className = "st-section-head";
    var t = document.createElement("span");
    t.className = "st-section-title";
    t.textContent = sec.title;
    head.appendChild(t);
    if (sec.meta) {
      var m = document.createElement("span");
      m.className = "st-meta";
      m.textContent = "∞ Meta";
      head.appendChild(m);
    }
    wrap.appendChild(head);
    items.forEach(function (it) { wrap.appendChild(stItemEl(it)); });
    list.appendChild(wrap);
  });
  /* 本家には無いが、☰メニューを廃止したのでリセットの入口をここに置いた（検索時は隠す） */
  if (!q) {
    var rs = document.createElement("div");
    rs.className = "st-section";
    var rl = document.createElement("div");
    rl.className = "st-link red";
    rl.textContent = "アカウントをリセット";
    rl.addEventListener("click", confirmResetAccount);
    rs.appendChild(rl);
    list.appendChild(rs);
  }
  if (!list.children.length) {
    var none = document.createElement("div");
    none.className = "pf-empty";
    none.textContent = "該当する設定が見つかりません";
    list.appendChild(none);
  }
}
