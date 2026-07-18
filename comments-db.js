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

  /* ===== ストーリーズ（フリー画像 picsum ＋ インフルエンサーっぽい一言） ===== */
  var STORY_SET = [
    { user: "rina_gal",       seed: "morning-coffee", text: "朝活☕✨ #丁寧な暮らし" },
    { user: "emma_travels",   seed: "sunrise-hill",   text: "Morning vibes 🌅 #nofilter" },
    { user: "yuna.xoxo",      seed: "sweets-cafe",    text: "ご褒美スイーツ🍰💕 並んだ甲斐あった" },
    { user: "kei.mindset",    seed: "running-road",   text: "5時起きラン🏃 今日も自分に勝った" },
    { user: "takashi_0358",   seed: "golf-green",     text: "ゴルフ日和だネ⛳😄ナイスショット❗" },
    { user: "official_taku",  seed: "studio-light",   text: "撮影終わり🎬 みんなお疲れさま" },
    { user: "mia.wanderlust", seed: "beach-blue",     text: "Beach day 🌊 living my best life" },
    { user: "sofia_bella",    seed: "outfit-street",  text: "New outfit 🖤 link in bio" },
    { user: "fan_no1_",       seed: "phone-desk",     text: "推しの投稿待機中📱（3時間目）" },
    { user: "carlos_mx",      seed: "tacos-night",    text: "Tacos night 🌮🔥 vamos!!" }
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
    DM_COMPANIES: DM_COMPANIES,
    STORY_SET: STORY_SET,
    BUZZ_TEXTS: BUZZ_TEXTS
  };
})();
