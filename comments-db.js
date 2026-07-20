/*
 * コメントDB — ペルソナ別テンプレート
 * 組み合わせ（名前 × 本文 × 絵文字）で実質無限にバリエーションが出る。
 * 追加したい時は各配列に足すだけ。
 */
window.KUSO_DB = (function () {
  "use strict";

  var AVATAR_COLORS = ["#d63c7b", "#5b51d8", "#f77737", "#00b8a9", "#8134af", "#eb4960", "#3897f0", "#70c050", "#c13584", "#fd8d32"];

  /* ===== 名前パーツ ===== */
  var GAL_NAMES = ["rina_gal", "yuna.xoxo", "momo_chan", "aya_pi", "runa.02", "kotone_v", "hina.gram", "miku_022", "nana_pien", "reina.ll"];
  var OVERSEAS_NAMES = ["emma_travels", "lucas.photo", "sofia_bella", "james_nyc", "mia.wanderlust", "noah_shoots", "olivia.daily", "kim_soo.min", "carlos_mx", "anna_berlin"];
  var OJISAN_NAMES = ["takashi_0358", "hiroshi.tanaka55", "ken1_papa", "masao_golf", "nobuo.sakura", "shigeru_60"];
  var ISHIKI_NAMES = ["kei.mindset", "growth_daiki", "sho_startup", "yuki_morning5am", "biz_ryota", "mindful_saki"];
  var FAN_NAMES = ["fan_no1_", "itsumo_miteru", "ouen_shiteru", "daisuki_desu", "kamisama_arigato", "mainichi_check"];
  var CELEB_NAMES = ["official_taku", "seiya_actor", "mei_model_official", "dj_kazu_official", "ayaka_singer"];
  var ANTI_NAMES = ["honne_iimasu", "karakuchi_man", "shinjitsu_teller"];

  /* ===== コメント本文 ===== */
  var GAL = [
    "え、待って尊すぎ🥺", "無理かわいい……語彙力", "は？？好き（直球）", "保存しました🙏✨",
    "これはバズる、知ってた", "てかもう好き", "スクショした←", "優勝〜〜〜🏆",
    "みんなこれ見て？？？", "え、天才では？？", "しんどいくらい良い", "きゅんです🫰",
    "待って通知来て秒で来た", "今日もセンス爆発してる", "これ壁紙にしていい？",
    "あーもう好きすぎて咳出た", "尊みが深い", "無理×100", "神すぎて拝んだ🙏",
    "この投稿で今日がんばれる", "ぴえん超えてぱおん🥺", "センスの塊で草", "何回見ても飽きない",
    "友達に共有した！", "バズれ！！！！", "いいねじゃ足りない", "説明文までおしゃれなの何？",
    "今日イチの癒し", "フォローしてよかった〜", "見た瞬間いいね押してた"
  ];
  var OVERSEAS = [
    "Amazing shot!! 🔥🔥", "This is incredible 😍", "Wow, just wow 👏", "Love this! ❤️",
    "Increíble 😍😍", "Qué maravilla 🙌", "So aesthetic ✨", "Goals!! 🙏",
    "Best post today 🔥", "I need to visit Japan 🇯🇵", "This made my day 😭❤️",
    "Perfection 👌", "Obsessed with your feed", "Stunning as always ✨",
    "너무 예뻐요 💕", "최고예요!! 👍", "Magnifique 😍", "Che bello! 🇮🇹",
    "You never disappoint 🙌", "Teach me your ways 🙏", "Insta famous for a reason 🔥",
    "The vibes are immaculate ✨", "Sheeeesh 🔥🔥🔥", "W post 🏆"
  ];
  var OJISAN = [
    "今日も素敵な一枚だネ❗😄おじさんも見習いたいナア〜📷✨",
    "いつも楽しみにしてるヨ😊✌️无理しないでネ❗",
    "ナイスショット❗👍😆今度おじさんにも撮り方教えてネ〜🙏",
    "カワイイね〜😍っと、失礼、写真がだヨ💦😅",
    "お疲れサマ😄✨こんな才能があるなんてスゴイなあ〜❗️おじさん感動しちゃったヨ😂",
    "グッドだね👍今度ご飯でもどうかな❓🍜なんてネ😅冗談だヨ〜",
    "毎日投稿えらいネ❗😊おじさんも元気もらってるヨ💪✨",
    "これはプロ級だネ📸✨雑誌に載れるヨ、ホントに❗😆"
  ];
  var ISHIKI = [
    "この構図、学びです。", "発信を続ける姿勢そのものが価値。リスペクトです🔥",
    "朝5時にこれを見て今日のモチベが確定しました", "これはマインドセットの勝利ですね",
    "『続ける人』だけが到達できる景色。まさにこれ。", "アウトプットの質が違いすぎる…メモしました📝",
    "影響力とは何かを考えさせられる投稿。シェアします。", "この行動力、見習わせていただきます",
    "自分のコンフォートゾーンを抜ける勇気をもらいました", "本質を突いてる。今日のベストポスト。",
    "これぞパーソナルブランディングの教科書", "気づきをありがとうございます。即実践します。"
  ];
  var FAN = [
    "いつも見てます！投稿ありがとうございます😭", "今日も推せます…！", "生きる希望です",
    "更新待ってました！！", "あなたのおかげで毎日頑張れてます", "一生ついていきます！",
    "お忙しい中投稿ありがとうございます🙏", "体調に気をつけてくださいね！ずっと応援してます",
    "初コメ失礼します！ずっとファンでした！", "この投稿に出会えた今日は良い日",
    "家族にも見せました！みんなファンになりました", "推しが今日も尊い…",
    "何があっても味方です！", "涙出ました。ありがとうございます。", "今日も素敵をありがとうございます✨"
  ];
  var CELEB = [
    "最高", "これは良い", "👏👏👏", "センスあるね", "今度コラボしよう",
    "負けた", "🔥", "さすが", "本物だ", "うちの事務所来る？"
  ];
  var GENERIC = [
    "神", "すき", "😍😍😍", "❤️❤️", "いいね100回押したい", "👏👏", "やば",
    "最&高", "エモい", "🔥🔥🔥", "無限に見れる", "はい優勝", "拝みました🙏", "尊い", "きれい…"
  ];

  /* アンチ→ファン擁護の小芝居（1セットで順番に投下される） */
  var ANTI_DRAMA = [
    [
      { p: "anti", t: "正直そこまでか…？" },
      { p: "fan", t: "は？どこ見てるんですか？？センスの塊なんですが？？" },
      { p: "gal", t: "嫉妬で草" },
      { p: "fan", t: "わからない人は通報でいいと思います" },
      { p: "anti", t: "すみませんでした。よく見たら神でした。フォローしました。" }
    ],
    [
      { p: "anti", t: "加工濃くない？" },
      { p: "fan", t: "これ無加工らしいですよ（震え）" },
      { p: "overseas", t: "Haters gonna hate 🙄✋" },
      { p: "gal", t: "アンチすら宣伝になってて草" }
    ],
    [
      { p: "anti", t: "よくあるやつじゃん" },
      { p: "ishiki", t: "『よくあるもの』をここまで昇華できるのが実力なんですよね。" },
      { p: "fan", t: "先生の努力も知らずに…😢" },
      { p: "anti", t: "確かに。浅かったです。保存しました。" }
    ]
  ];

  /* ===== 投稿画面の音源候補（本家のおすすめ音源カード） ===== */
  var MUSIC_SUGGESTIONS = [
    { title: "イケナイ太陽・ORAN...", art: "https://loremflickr.com/80/80/album,music?lock=101" },
    { title: "ロコローション",       art: "https://loremflickr.com/80/80/summer,record?lock=102" },
    { title: "前前前世・RADWIM...",   art: "https://loremflickr.com/80/80/concert,band?lock=103" },
    { title: "怪獣の花唄・Vaundy",   art: "https://loremflickr.com/80/80/guitar,stage?lock=104" }
  ];
  var MUSIC_TOP = { title: "DWIMPS・七ノ歌", sub: "おすすめの音源", art: "https://loremflickr.com/80/80/vinyl,record?lock=105" };

  /* ===== キャプションテンプレ ===== */
  var CAPTION_TMPL = [
    "今日もいい日だった✨感謝",
    "何気ない日常が、いちばん尊い。",
    "みんなはどう思う？コメントで教えて👇",
    "これ、伝わる人には伝わるはず。",
    "頑張った自分へのご褒美🎁",
    "особый день✨（特別な日）",
    "言葉はいらない。",
    "また来たいな〜📍",
    "気づいたら撮ってた一枚📷",
    "フォロワーのみんな、いつもありがとう🙏"
  ];

  /* ===== 企業案件DM ===== */
  var DM_COMPANIES = [
    { name: "株式会社グロウアップ", msg: "はじめまして！株式会社グロウアップPR担当の佐々木と申します。\n\n先ほどのご投稿を拝見し、ぜひ弊社新商品のPRをお願いできないかとご連絡いたしました。\n\n報酬：1投稿 ¥300,000〜\n\nご検討いただけますと幸いです🙇" },
    { name: "Beauté Tokyo 広報", msg: "突然のご連絡失礼いたします💄\n\n貴アカウントの世界観が弊社ブランドと完璧にマッチしており、アンバサダー契約のご相談をさせてください。\n\n年間契約：¥3,600,000（応相談）\n\nお返事お待ちしております✨" },
    { name: "TravelJP 編集部", msg: "お世話になっております、TravelJP編集部です✈️\n\nご投稿のクオリティに編集部一同衝撃を受けております。\n\n次号の巻頭特集にぜひご登場いただけないでしょうか。撮影は全て弊社負担、謝礼もご用意しております。" },
    { name: "FitLife Japan", msg: "はじめまして！FitLife Japanマーケティング部です💪\n\n弊社プロテインの公式アンバサダーをお願いしたく、ご連絡いたしました。\n\n・商品1年分無償提供\n・投稿ごとに報酬あり\n\n前向きにご検討ください！" },
    { name: "カフェ・ルミエール広報", msg: "素敵なご投稿をありがとうございます☕\n\n弊店の新メニュー試食会に特別ご招待させてください。\n\nもちろん交通費・謝礼もご用意しております。インフルエンサー様限定のご案内です🍰" },
    { name: "TV番組『バズった人』制作班", msg: "突然失礼いたします。テレビ番組『バズった人』のディレクターです📺\n\n「今最も勢いのあるインフルエンサー」特集で、ぜひご出演いただきたくご連絡いたしました。\n\n収録は1日、謝礼あり。ご検討ください！" }
  ];

  /* ===== 名前入りコメント（{name}をプロフィール名に置換。APIは使わずテンプレで実現） ===== */
  var NAME_COMMENTS = [
    "{name}くんの投稿はやっぱ違うわ〜！好き🥺",
    "{name}さん今日もお疲れ様です🙏✨",
    "え、{name}最高すぎ😭 一生ついていきます！",
    "{name}のセンス、ほんとに好きなんよ",
    "{name}さんに会える日を楽しみにしてます！",
    "{name}くん、今日もありがとう☺️元気出た",
    "{name}様の世界観、完全に沼です💕",
    "待って{name}天才？？保存した📌",
    "{name}さんの投稿で1日がんばれる✊"
  ];

  /* ===== 公式/他人の投稿（フィードが寂しくないように。全部テンプレ＝API不使用） ===== */
  /* likes は固定値ではなく「自分の投稿を基準にした比率(ratio)」。
     常に僅差の勝負になり、自分が上位層にいる感覚を保つのが狙い。
     ratio>1 は有名人1人だけ（たまに自分が抜く緊張感を出すため）。 */
  var SEED_POSTS = [
    { user: "official_taku", icon: "https://i.pravatar.cc/150?img=59", verified: true, seed: "studio-shoot", kw: "studio,camera", caption: "撮影終わり🎬 みんなお疲れさま。差し入れ感謝です🙏", ratio: 1.02 },
    { user: "emma_travels", icon: "https://i.pravatar.cc/150?img=44", verified: false, seed: "budapest-night", kw: "budapest,night", caption: "Budapest at night 🌉✨ living the dream #travel #europe", ratio: 0.83 },
    { user: "rina_gal", icon: "https://i.pravatar.cc/150?img=47", verified: false, seed: "new-nail-pink", kw: "nail,manicure", caption: "ネイル変えた💅✨ この色、優勝じゃない？？気づいた人天才", ratio: 0.71 },
    { user: "hime_icingcookie", icon: "https://loremflickr.com/150/150/cookie?lock=81", verified: false, seed: "icing-cookies", kw: "cookie,icing", caption: "アイシングクッキー焼きました🍪💕 オーダー受付中です☺️", ratio: 0.58 },
    { user: "kei.mindset", icon: "https://i.pravatar.cc/150?img=12", verified: false, seed: "morning-run-road", kw: "running,road", caption: "5時起きラン完了🏃 今日も自分に勝った。継続は裏切らない。", ratio: 0.46 }
  ];

  /* ===== 検索/発見タブ =====
     動画は Pexels の無料素材（縦360x640の軽量SD・全URL実機検証済み）。
     読み込みに失敗しても poster(picsum) が残るのでグリッドは崩れない。 */
  function pv(id, fps) {
    return "https://videos.pexels.com/video-files/" + id + "/" + id + "-sd_360_640_" + fps + "fps.mp4";
  }
  var EXPLORE_ITEMS = [
    { seed: "ex-gym-flip",   kw: "gym,fitness",   video: pv(7703994, 25), views: 5120000 },
    { seed: "ex-breakdance", kw: "breakdance",    video: pv(7583538, 25), views: 94000 },
    { seed: "ex-peach",      kw: "peach,fruit",   video: null,            views: 1060000, text: "桃を一番うまく食べる方法" },
    { seed: "ex-street",     kw: "street,dance",  video: pv(7583536, 25), views: 143000 },
    { seed: "ex-cat-jump",   kw: "cat,jump",      video: null,            views: 12950000 },
    { seed: "ex-park-run",   kw: "park,running",  video: pv(7656813, 25), views: 146000 },
    { seed: "ex-mapo",       kw: "mapo,tofu",     video: null,            views: 3590000, text: "世界一旨い麻婆の作り方" },
    { seed: "ex-golf",       kw: "golf,swing",    video: pv(18205486, 25), views: 110000000 },
    { seed: "ex-ninja",      kw: "ninja,martial", video: null,            views: 3280000 },
    { seed: "ex-powermove",  kw: "bboy,dance",    video: pv(6616344, 25), views: 872000, text: "クラシカルスキル\n移動2歩" },
    { seed: "ex-ramen",      kw: "ramen,noodles", video: null,            views: 2140000, text: "世界一旨い\nラーメンの食べ方" },
    { seed: "ex-howto",      kw: "workshop,diy",  video: pv(11510530, 30), views: 660000, text: "HOW TO DO THIS？" },
    { seed: "ex-cafe-latte", kw: "latte,cafe",    video: null,            views: 418000 },
    { seed: "ex-dance-2",    kw: "dance,studio",  video: pv(6939971, 30), views: 7300000 },
    { seed: "ex-sunset",     kw: "sunset,sky",    video: null,            views: 259000 },
    { seed: "ex-dog-trick",  kw: "dog,puppy",     video: null,            views: 6640000, text: "犬が計算できるようになった" },
    { seed: "ex-skate",      kw: "skateboard",    video: null,            views: 1830000 },
    { seed: "ex-makeup",     kw: "makeup,beauty", video: null,            views: 921000, text: "10分で別人になる方法" },
    { seed: "ex-sushi",      kw: "sushi,japanese",video: null,            views: 4470000 },
    { seed: "ex-guitar",     kw: "guitar,music",  video: null,            views: 336000 },
    { seed: "ex-mountain",   kw: "mountain,hike", video: null,            views: 1520000 }
  ];

  /* ===== リールタブ =====
     local を先に読み、無ければ fallback(Pexels) に自動で切り替わる。
     assets/videos/reelN.mp4 を置くだけで自作動画に差し替わる（コード修正不要）。 */
  var REEL_ITEMS = [
    { user: "steel8___",     verified: true,  audio: "grave, TWERNKATION", caption: "力を出す中 …", likes: 2641, cmt: 35, rep: 71, send: 255, fallback: pv(7703994, 25) },
    { user: "rina_gal",      verified: false, audio: "オリジナル音源 ・ rina_gal", caption: "今日の練習🔥 #dance", likes: 18420, cmt: 214, rep: 330, send: 1204, fallback: pv(7583538, 25) },
    { user: "emma_travels",  verified: true,  audio: "Summer Vibes ・ LOSTBOY", caption: "golden hour never misses ✨", likes: 92300, cmt: 881, rep: 1420, send: 5600, fallback: pv(7583536, 25) },
    { user: "kei.mindset",   verified: false, audio: "Morning Routine ・ lofi", caption: "5時起き、継続260日目。", likes: 7310, cmt: 96, rep: 140, send: 402, fallback: pv(7656813, 25) },
    { user: "official_taku", verified: true,  audio: "撮影の裏側 ・ official_taku", caption: "現場からは以上です🎬", likes: 214000, cmt: 3120, rep: 4800, send: 12400, fallback: pv(18205486, 25) },
    { user: "mia.wanderlust",verified: false, audio: "Ocean ・ chillhop", caption: "海に全部流してきた🌊", likes: 34100, cmt: 402, rep: 610, send: 2100, fallback: pv(6616344, 25) },
    { user: "yuna.xoxo",     verified: false, audio: "きゅん ・ yuna.xoxo", caption: "新作スイーツ食べに行った🍰", likes: 12800, cmt: 173, rep: 260, send: 890, fallback: pv(11510530, 30) },
    { user: "carlos_mx",     verified: false, audio: "Fiesta ・ Los Amigos", caption: "vamos!! 🌮🔥", likes: 5620, cmt: 74, rep: 118, send: 330, fallback: pv(6939971, 30) }
  ];

  /* プロフィールの「フォローする人を見つけよう」 */
  var DISCOVER_ACCOUNTS = [
    { user: "domiikagortat",  icon: "https://i.pravatar.cc/150?img=32", mutual: 2 },
    { user: "TKF_info_AIU",   icon: "https://picsum.photos/seed/tkf-school/150/150", mutual: 14 },
    { user: "mikan_films",    icon: "https://i.pravatar.cc/150?img=26", mutual: 5 },
    { user: "aoi_travels.jp", icon: "https://i.pravatar.cc/150?img=40", mutual: 9 },
    { user: "sora_bakery",    icon: "https://picsum.photos/seed/bakery-icon/150/150", mutual: 3 },
    { user: "yohei_films",    icon: "https://i.pravatar.cc/150?img=54", mutual: 21 }
  ];

  /* ===== 設定とアクティビティ（本家スクショ4枚を完コピ） ===== */
  var SETTINGS_SECTIONS = [
    { title: "あなたのアカウント", meta: true, items: [
      { ic: "person", label: "アカウントセンター", sub: "パスワード、セキュリティ、個人情報、コネクテッドエクスペリエンス、広告表示の設定" }
    ]},
    { title: "Instagramの利用方法", items: [
      { ic: "bookmark", label: "保存済み" },
      { ic: "archive", label: "アーカイブ" },
      { ic: "chart", label: "アクティビティ" },
      { ic: "bell", label: "お知らせ" },
      { ic: "clock", label: "時間管理" },
      { ic: "tablet", label: "iPad用Instagram" }
    ]},
    { title: "コンテンツの公開範囲", items: [
      { ic: "lock", label: "アカウントのプライバシー", value: "非公開" },
      { ic: "star", label: "親しい友達", value: "221" },
      { ic: "gridplus", label: "クロス投稿" },
      { ic: "ban", label: "ブロックされているアカウント", value: "1" },
      { ic: "ban", label: "ストーリーズ、ライブ、位置情報" },
      { ic: "people", label: "[友達]フィードでのアクティビティ" }
    ]},
    { title: "他の人があなたとやり取りできる方法", items: [
      { ic: "message", label: "メッセージとストーリーズへの返信" },
      { ic: "at", label: "タグとメンション" },
      { ic: "comment", label: "コメント" },
      { ic: "repost", label: "シェア" },
      { ic: "face", label: "アバターのインタラクション" },
      { ic: "ban", label: "制限中", value: "1" },
      { ic: "warn", label: "やり取りを制限", value: "オフ" },
      { ic: "aa", label: "非表示ワード" },
      { ic: "personplus", label: "友達をフォロー・招待する" }
    ]},
    { title: "表示されるコンテンツ", items: [
      { ic: "star", label: "お気に入り", value: "6" },
      { ic: "ban", label: "ミュート済みのアカウント", value: "7" },
      { ic: "play", label: "コンテンツ設定" },
      { ic: "heartban", label: "「いいね！」数とシェア数" }
    ]},
    { title: "アプリとメディア", items: [
      { ic: "tablet", label: "デバイスのアクセス許可" },
      { ic: "download", label: "アーカイブとダウンロード" },
      { ic: "access", label: "アクセシビリティ" },
      { ic: "translate", label: "言語と翻訳" },
      { ic: "chart", label: "メディアの画質" },
      { ic: "laptop", label: "アプリのウェブサイトへのアクセス許可" }
    ]},
    { title: "ファミリーセンター", items: [
      { ic: "people", label: "ティーンアカウントのペアレンタルコントロール" }
    ]},
    { title: "インサイトとツール", items: [
      { ic: "chart", label: "アカウントの種類とツール" }
    ]},
    { title: "サブスクリプション", items: [
      { ic: "star", label: "Instagram Plus", value: "サブスクリプション未登録" },
      { ic: "badge", label: "Meta認証", value: "サブスクリプション未登録" }
    ]},
    { title: "注文と募金キャンペーン", items: [
      { ic: "receipt", label: "注文と支払い" }
    ]},
    { title: "詳細とサポート", items: [
      { ic: "help", label: "ヘルプ" },
      { ic: "sparkle", label: "Meta AIサポートアシスタント" },
      { ic: "shield", label: "プライバシーセンター" },
      { ic: "person", label: "アカウントステータス" },
      { ic: "info", label: "基本データ" }
    ]},
    { title: "その他のMeta製アプリ", items: [
      { ic: "at", label: "Threads", sub: "アイデアをシェアして会話に参加しよう" },
      { ic: "infinity", label: "その他のMeta製アプリ" }
    ]},
    { title: "ログイン", items: [
      { label: "アカウントを追加", link: "blue" },
      { label: "ログアウト", link: "red" }
    ]}
  ];

  /* ===== 広告投稿（フィードに混ざる） ===== */
  var AD_POSTS = [
    { user: "levtech_rookie", icon: "https://loremflickr.com/150/150/office?lock=91", seed: "ad-it-expo", kw: "conference,business",
      cta: "詳細を見る", caption: "【オンライン就活イベント】超優良IT企業14社が集結", likes: 46, cmt: 3, rep: 1, send: 3 },
    { user: "protein_lab.jp", icon: "https://loremflickr.com/150/150/protein?lock=92", seed: "ad-protein", kw: "protein,fitness",
      cta: "ショップを見る", caption: "【初回50%OFF】飲みやすさで選ばれ続けて3年", likes: 128, cmt: 9, rep: 4, send: 11 },
    { user: "sumai_no_madoguchi", icon: "https://loremflickr.com/150/150/house?lock=93", seed: "ad-house", kw: "house,interior",
      cta: "お問い合わせ", caption: "家賃と同じ支払いで、持ち家という選択。無料相談受付中", likes: 72, cmt: 2, rep: 1, send: 5 }
  ];

  /* ===== プロフィールのリール／タグ付けタブ（仮） ===== */
  var PROFILE_REELS = [
    { seed: "pf-reel-1", kw: "dance,studio",  views: 775 },
    { seed: "pf-reel-2", kw: "lake,mountain", views: 1889 },
    { seed: "pf-reel-3", kw: "cafe,latte",    views: 12400 },
    { seed: "pf-reel-4", kw: "street,city",   views: 3260 },
    { seed: "pf-reel-5", kw: "sunset,beach",  views: 548 },
    { seed: "pf-reel-6", kw: "party,friends", views: 90200 }
  ];
  var PROFILE_TAGGED = [
    { seed: "pf-tag-1", kw: "pyramid,egypt",   multi: true },
    { seed: "pf-tag-2", kw: "pool,resort",     multi: true },
    { seed: "pf-tag-3", kw: "izakaya,dinner",  multi: false },
    { seed: "pf-tag-4", kw: "party,night",     multi: false },
    { seed: "pf-tag-5", kw: "chandelier,hall", multi: true },
    { seed: "pf-tag-6", kw: "restaurant,food", multi: false },
    { seed: "pf-tag-7", kw: "friends,group",   multi: false },
    { seed: "pf-tag-8", kw: "travel,street",   multi: true },
    { seed: "pf-tag-9", kw: "cafe,window",     multi: false }
  ];

  /* ハンバーガーメニュー（それっぽく埋めるだけ・中身は Coming soon） */
  var PROFILE_MENU = [
    { ic: "⚙", label: "設定とアクティビティ" },
    { ic: "🗂", label: "アーカイブ" },
    { ic: "📊", label: "インサイト" },
    { ic: "🔖", label: "保存済み" },
    { ic: "⭐", label: "お気に入り" },
    { ic: "💚", label: "親しい友達" },
    { ic: "🔗", label: "QRコード" },
    { ic: "🧾", label: "アカウントの種類とツール" },
    { ic: "🕒", label: "利用時間" }
  ];

  /* 検索サジェスト（有名人あるある。{name}はプロフィール名に置換） */
  var SEARCH_SUFFIXES = ["彼女", "年収", "自宅", "wiki", "事務所", "本名", "身長", "すっぴん", "実家 金持ち"];

  /* ===== 一般の人から届くDM（企業案件だけだと不自然なので） ===== */
  var DM_PEOPLE = [
    "はじめまして！いつも投稿見てます😳 勇気出してDMしました…！",
    "突然すみません🙇 さっきの投稿、どこで撮ったか聞いてもいいですか？",
    "フォローさせていただきました！これからも楽しみにしてます✨",
    "あの…前から気になってたんですけど、使ってるカメラ何ですか？📷",
    "投稿めっちゃ好きです！！返信とか来ないと思うけど言いたかっただけです😭",
    "こんばんは！今度こっち来るとき、おすすめのお店紹介させてください🍜",
    "友達に紹介したらその子もファンになりました😂 影響力すごい",
    "しんどい時にいつも救われてます。ありがとうございます🙏",
    "急にすみません！私も発信始めたんですが、続けるコツとかありますか？",
    "え、本物の方ですよね…？？震えてます🥺",
    "今日の投稿、待ち受けにしました📱 かわいすぎる",
    "いつか会えたら嬉しいです！ずっと応援してます🔥"
  ];
  /* 一般の人に返信した時の反応（めっちゃ盛り上がる） */
  var DM_PEOPLE_REPLIES = [
    "え！？！？返信きた…！？！？うそ、心臓止まるかと思った😭😭",
    "まって本物…？？スクショ撮りました、一生の宝物にします🙏✨",
    "返信いただけると思ってなくて叫びました。ほんとにありがとうございます…！",
    "家族に自慢していいですか！？もう泣いてます😭",
    "神…！！一生ついていきます！！！",
    "友達にも見せたら『捏造でしょ』って言われました😂 本物なのに！",
    "今日が人生で一番いい日です。ありがとうございます🥲"
  ];

  /* ===== 企業DMに「ぜひ！」と返した時の段階的な返信（売れっ子ごっこ） ===== */
  var DM_REPLIES = [
    "わあ、ありがとうございます😭✨ では早速、契約書をお送りいたしますね！ご確認のほどよろしくお願いいたします📄",
    "嬉しいです🙏 弊社一同、〇〇様とご一緒できるのを本当に楽しみにしております！",
    "早速で恐縮ですが、来週あたりで撮影日程を1日お押さえいただけますでしょうか？📅 スタジオも都内でご用意します！",
    "報酬のお振込先は、後ほど専用フォームよりお伺いいたします💰 ご希望であれば前払いも対応可能です！",
    "SNSでも『大型コラボ決定』として告知させていただいてよろしいですか？🎉 拡散はお任せください！",
    "本件、上長にも共有しました。『ぜひ長期契約で』との返答です…！差し支えなければ年間契約もご検討ください🙇",
    "重ねての連絡失礼します！他部署からも『あの方とやりたい』と声が上がっておりまして…引く手あまたですね😳✨"
  ];

  /* ===== ストーリーズ（フリー画像 picsum ＋ インフルエンサーっぽい一言） ===== */
  /* アカウントごとにストーリーを1〜3本持つ（本家仕様: プログレスバーはアカウント内の本数分）
     icon: 人物 = pravatar（フリー素材の顔写真）、風景派 = picsum */
  var STORY_ACCOUNTS = [
    { user: "rina_gal", icon: "https://i.pravatar.cc/150?img=47", stories: [
      { seed: "morning-coffee", kw: "coffee,morning",   text: "朝活☕✨ #丁寧な暮らし" },
      { seed: "latte-art",      kw: "latte,art",        text: "ラテアート優勝すぎん？🥛" },
      { seed: "new-nail",       kw: "nail,manicure",    text: "ネイル変えた💅 気づいた人天才" }
    ]},
    { user: "emma_travels", icon: "https://i.pravatar.cc/150?img=44", stories: [
      { seed: "sunrise-hill", kw: "sunrise,hill",   text: "Morning vibes 🌅 #nofilter" },
      { seed: "airport-gate", kw: "airport,airplane", text: "Next stop: Tokyo ✈️✨" }
    ]},
    { user: "yuna.xoxo", icon: "https://i.pravatar.cc/150?img=45", stories: [
      { seed: "sweets-cafe", kw: "cake,dessert", text: "ご褒美スイーツ🍰💕 並んだ甲斐あった" }
    ]},
    { user: "kei.mindset", icon: "https://i.pravatar.cc/150?img=12", stories: [
      { seed: "running-road", kw: "running,road", text: "5時起きラン🏃 今日も自分に勝った" },
      { seed: "book-note",    kw: "book,notebook", text: "朝読書📚 インプットの鬼になる" }
    ]},
    { user: "takashi_0358", icon: "https://i.pravatar.cc/150?img=52", stories: [
      { seed: "golf-green", kw: "golf,green", text: "ゴルフ日和だネ⛳😄ナイスショット❗" }
    ]},
    { user: "official_taku", icon: "https://i.pravatar.cc/150?img=59", stories: [
      { seed: "studio-light", kw: "studio,light", text: "撮影終わり🎬 みんなお疲れさま" },
      { seed: "green-room",   kw: "backstage,mirror", text: "楽屋なう。差し入れ感謝🙏" }
    ]},
    { user: "mia.wanderlust", icon: "https://loremflickr.com/150/150/beach?lock=61", stories: [
      { seed: "beach-blue",  kw: "beach,ocean", text: "Beach day 🌊 living my best life" },
      { seed: "sunset-surf", kw: "sunset,surf", text: "golden hour 🌇 no words needed" }
    ]},
    { user: "sofia_bella", icon: "https://i.pravatar.cc/150?img=49", stories: [
      { seed: "outfit-street", kw: "fashion,outfit", text: "New outfit 🖤 link in bio" }
    ]},
    { user: "fan_no1_", icon: "https://loremflickr.com/150/150/smartphone?lock=62", stories: [
      { seed: "phone-desk", kw: "smartphone,desk", text: "推しの投稿待機中📱（3時間目）" },
      { seed: "goods-wall", kw: "poster,wall",     text: "祭壇、更新しました🙏✨" },
      { seed: "snack-pile", kw: "snack,chocolate", text: "夜通し待機用の夜食スタンバイ🍫" }
    ]},
    { user: "carlos_mx", icon: "https://i.pravatar.cc/150?img=68", stories: [
      { seed: "tacos-night", kw: "tacos,mexican", text: "Tacos night 🌮🔥 vamos!!" }
    ]}
  ];

  /* ===== 本人が返信/コメントした時にファンが沸くテンプレ ===== */
  var REPLY_FAN = [
    "うわ、本人から返信きた！！家宝にします🙏",
    "返信もらえてて草 うらやましすぎる",
    "え、ちゃんと返信するタイプの神インフルエンサーじゃん…",
    "この距離感よ。だから好きなんだよなあ",
    "スクショして額に入れました",
    "本人降臨してて草",
    "神対応すぎて泣いた😭",
    "ここに聖地が生まれました",
    "返信欄まで面白いのずるい",
    "私にもいつか返信ください！！🙏🙏"
  ];

  /* ===== プロフィールのハイライト（丸アイコン列 → タップでストーリー風に再生） ===== */
  var HIGHLIGHTS = [
    { label: "BALI ✈️", cover: "https://loremflickr.com/200/200/bali,beach?lock=71", stories: [
      { seed: "hl-bali-1", kw: "bali,palm", text: "楽園きちゃった🌴 #bali" },
      { seed: "hl-bali-2", kw: "infinity,pool", text: "インフィニティプール優勝🏊" },
      { seed: "hl-bali-3", kw: "sunset,dinner", text: "サンセットディナー🌇 言葉いらない" }
    ]},
    { label: "お仕事", cover: "https://loremflickr.com/200/200/photoshoot?lock=72", stories: [
      { seed: "hl-work-1", kw: "photoshoot,camera", text: "撮影でした📸 楽しかった〜" },
      { seed: "hl-work-2", kw: "product,cosmetics", text: "新商品、ちょっとだけお見せ👀✨ #pr" }
    ]},
    { label: "日常", cover: "https://loremflickr.com/200/200/morning,coffee?lock=73", stories: [
      { seed: "hl-daily-1", kw: "morning,coffee", text: "何気ない朝がいちばん尊い☕" },
      { seed: "hl-daily-2", kw: "walk,street", text: "散歩の途中で📷 #丁寧な暮らし" }
    ]},
    { label: "カフェ☕", cover: "https://loremflickr.com/200/200/cafe?lock=74", stories: [
      { seed: "hl-cafe-1", kw: "cafe,cake", text: "映えカフェ開拓🍰 並んだ甲斐あった" }
    ]},
    { label: "コスメ💄", cover: "https://loremflickr.com/200/200/cosmetics?lock=75", stories: [
      { seed: "hl-cosme-1", kw: "cosmetics,makeup", text: "最近のお気に入り💄 #pr" },
      { seed: "hl-cosme-2", kw: "lipstick,makeup", text: "この色、優勝じゃない？💕" }
    ]}
  ];

  /* ===== フォロワー一覧の先頭に並ぶ有名人風（認証済み） ===== */
  var FOLLOWER_VIPS = [
    "hikaru_official", "yuka_beauty.jp", "tokyo_foodie_", "kenta_fitness", "aoi_travels.jp",
    "dj_ryo_official", "maki_cosme", "shota_photo.tokyo", "rena_model_official", "yusuke_ceo"
  ];

  /* ===== アクティビティの通知種別（重み付き） ===== */
  /* オープンアカウント設定なので「フォローリクエスト承認」は無し（誰でも自由にフォローできる） */
  var NOTIF_KINDS = [
    { k: "storyLike", w: 26 },
    { k: "postLike",  w: 22 },
    { k: "follow",    w: 22 },
    { k: "comment",   w: 9 },
    { k: "mention",   w: 7 },
    { k: "save",      w: 6 },
    { k: "share",     w: 5 },
    { k: "suggest",   w: 3 }
  ];
  var SUGGEST_ACCOUNTS = ["aiucolors", "tokyo_neon.jp", "cafe_meguri", "minimal_room_", "yohei_films", "sora_bakery"];

  /* ===== 通知タブのテンプレ ===== */
  var NOTIF_TEMPLATES = [
    { t: "さんがあなたの投稿に「いいね！」しました", w: 50 },
    { t: "さんがあなたをフォローしました", w: 20 },
    { t: "さんがあなたのコメントに「いいね！」しました", w: 15 },
    { t: "さんがストーリーズであなたをメンションしました", w: 8 },
    { t: "さんがあなたの投稿を保存しました", w: 7 }
  ];

  /* ===== バズ通知 ===== */
  var BUZZ_TEXTS = [
    "あなたの投稿が発見タブのトップに掲載されました",
    "あなたの投稿が急上昇1位になりました",
    "海外メディアがあなたの投稿を紹介しました",
    "「今日のベストポスト」に選出されました"
  ];

  return {
    AVATAR_COLORS: AVATAR_COLORS,
    PERSONAS: {
      gal: { names: GAL_NAMES, texts: GAL, weight: 26 },
      overseas: { names: OVERSEAS_NAMES, texts: OVERSEAS, weight: 20 },
      ojisan: { names: OJISAN_NAMES, texts: OJISAN, weight: 8 },
      ishiki: { names: ISHIKI_NAMES, texts: ISHIKI, weight: 12 },
      fan: { names: FAN_NAMES, texts: FAN, weight: 18 },
      celeb: { names: CELEB_NAMES, texts: CELEB, weight: 4, verified: true },
      generic: { names: GAL_NAMES.concat(OVERSEAS_NAMES, FAN_NAMES), texts: GENERIC, weight: 12 }
    },
    ANTI_NAMES: ANTI_NAMES,
    ANTI_DRAMA: ANTI_DRAMA,
    CAPTION_TMPL: CAPTION_TMPL,
    MUSIC_SUGGESTIONS: MUSIC_SUGGESTIONS,
    MUSIC_TOP: MUSIC_TOP,
    DM_COMPANIES: DM_COMPANIES,
    DM_REPLIES: DM_REPLIES,
    DM_PEOPLE: DM_PEOPLE,
    DM_PEOPLE_REPLIES: DM_PEOPLE_REPLIES,
    NAME_COMMENTS: NAME_COMMENTS,
    SEED_POSTS: SEED_POSTS,
    EXPLORE_ITEMS: EXPLORE_ITEMS,
    SEARCH_SUFFIXES: SEARCH_SUFFIXES,
    REEL_ITEMS: REEL_ITEMS,
    DISCOVER_ACCOUNTS: DISCOVER_ACCOUNTS,
    PROFILE_MENU: PROFILE_MENU,
    SETTINGS_SECTIONS: SETTINGS_SECTIONS,
    AD_POSTS: AD_POSTS,
    PROFILE_REELS: PROFILE_REELS,
    PROFILE_TAGGED: PROFILE_TAGGED,
    STORY_ACCOUNTS: STORY_ACCOUNTS,
    BUZZ_TEXTS: BUZZ_TEXTS,
    REPLY_FAN: REPLY_FAN,
    NOTIF_TEMPLATES: NOTIF_TEMPLATES,
    NOTIF_KINDS: NOTIF_KINDS,
    SUGGEST_ACCOUNTS: SUGGEST_ACCOUNTS,
    HIGHLIGHTS: HIGHLIGHTS,
    FOLLOWER_VIPS: FOLLOWER_VIPS
  };
})();
