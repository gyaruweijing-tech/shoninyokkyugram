# ROADMAP — 自動開発キュー

Routineが毎回ここを読んで「未実装(status=todo)で、対応スクショが `refs/` にある一番上の1件」を実装する。
**状態**: `todo`（未着手） / `done`（完了） / `blocked`（詰まった・要人間判断）
**優先度**: P1（本家で目立つ・価値高い） / P2 / P3（地味・後回し可）

## スクショの入れ方（あなたの担当）
- `refs/` に、下表の「スクショ名」の通りのファイル名で本家Instagramのスクショを置く
- **スクショが無い機能はRoutineがスキップする** → 撮った順に開発が進む。順番はあなたが制御できる
- プライバシー：自分のアカウント名・顔・実データが写る箇所はトリミング/隠す

---

## A. 設定サブ画面（設定→各項目タップで開く画面）
遷移元: 設定画面の各行 / 実装場所の目安: `index.html`(新viewの markup+CSS) + `js/views.js`(switchView) + `js/settings.js`(タップ結線)

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| S01 | アカウントセンター | set-account-center.png | P2 | todo |
| S02 | 保存済み | set-saved.png (+ -collections/-series/-reels/-posts) | P1 | done |
| S03 | アーカイブ | set-archive.png | P1 | todo |
| S04 | お知らせ（通知設定） | set-notifications.png | P2 | todo |
| S05 | 時間管理 | set-time.png | P2 | todo |
| S06 | iPad用Instagram | set-ipad.png | P3 | todo |
| S07 | アカウントのプライバシー | set-privacy.png | P1 | todo |
| S08 | 親しい友達 | set-closefriends.png | P1 | todo |
| S09 | クロス投稿 | set-crosspost.png | P3 | todo |
| S10 | ブロックされているアカウント | set-blocked.png | P2 | todo |
| S11 | ストーリーズ、ライブ、位置情報 | set-story-live.png | P2 | todo |
| S12 | [友達]フィードでのアクティビティ | set-friends-feed.png | P3 | todo |
| S13 | メッセージとストーリーズへの返信 | set-msg-reply.png | P2 | todo |
| S14 | タグとメンション | set-tag-mention.png | P2 | todo |
| S15 | コメント（設定） | set-comment.png | P2 | todo |
| S16 | シェア | set-share.png | P3 | todo |
| S17 | アバターのインタラクション | set-avatar.png | P3 | todo |
| S18 | 制限中 | set-restricted.png | P2 | todo |
| S19 | やり取りを制限 | set-limit.png | P3 | todo |
| S20 | 非表示ワード | set-hidden-words.png | P2 | todo |
| S21 | 友達をフォロー・招待する | set-invite.png | P3 | todo |
| S22 | お気に入り | set-favorites.png | P1 | todo |
| S23 | ミュート済みのアカウント | set-muted.png | P2 | todo |
| S24 | コンテンツ設定 | set-content-pref.png | P3 | todo |
| S25 | 「いいね！」数とシェア数 | set-like-count.png | P2 | todo |
| S26 | デバイスのアクセス許可 | set-device-perm.png | P3 | todo |
| S27 | アーカイブとダウンロード | set-download.png | P2 | todo |
| S28 | アクセシビリティ | set-accessibility.png | P2 | todo |
| S29 | 言語と翻訳 | set-language.png | P2 | todo |
| S30 | メディアの画質 | set-media-quality.png | P3 | todo |
| S31 | アプリのウェブサイトへのアクセス許可 | set-web-perm.png | P3 | todo |
| S32 | ティーンのペアレンタルコントロール | set-parental.png | P3 | todo |
| S33 | アカウントの種類とツール | set-account-tools.png | P2 | todo |
| S34 | Instagram Plus | set-ig-plus.png | P2 | todo |
| S35 | Meta認証 | set-meta-verified.png | P2 | todo |
| S36 | 注文と支払い | set-orders.png | P3 | todo |
| S37 | ヘルプ | set-help.png | P2 | todo |
| S38 | Meta AIサポートアシスタント | set-meta-ai.png | P3 | todo |
| S39 | プライバシーセンター | set-privacy-center.png | P3 | todo |
| S40 | アカウントステータス | set-account-status.png | P3 | todo |
| S41 | 基本データ | set-basic-data.png | P3 | todo |
| S42 | Threads | set-threads.png | P3 | todo |
| S43 | その他のMeta製アプリ | set-more-apps.png | P3 | todo |
| S44 | アカウントを追加 | set-add-account.png | P2 | todo |
| S45 | ログアウト | set-logout.png | P2 | todo |

## B. プロフィール・ハンバーガーメニュー / プロフィール上のボタン
遷移元: プロフィール☰ / プロフィール各所（`js/main.js`, `js/views.js`）
※ 保存済み(S02)/アーカイブ(S03)/お気に入り(S22)/親しい友達(S08)/アカウントの種類とツール(S33)/利用時間(S05) は A と重複 → Aで実装すれば流用

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| M02 | インサイト（メニューから） | menu-insights.png | P1 | todo |
| M06 | QRコード | menu-qr.png | P1 | todo |
| P01 | プロフィールのシェア | pf-share.png | P3 | todo |
| P02 | Threadsバッジ（プロフィール） | pf-threads.png | P3 | todo |
| P03 | バナーの追加 | pf-banner.png | P3 | todo |
| P04 | ノート | pf-note.png | P2 | todo |
| P05 | すべて見る（発見） | pf-seeall.png | P3 | todo |
| P06 | アカウント切替 | pf-switch-account.png | P2 | todo |

## C. フィード / 投稿詳細
遷移元: フィード投稿（`js/feed.js`）

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| F01 | フィードのコメント機能（大物・既存シート流用可） | feed-comment.png | P1 | todo |
| F02 | 音源の追加 | feed-music.png | P3 | todo |
| F03 | 投稿メニュー(···)の各項目 | feed-post-menu.png | P2 | todo |
| F04 | 広告を非表示 | feed-ad-hide.png | P3 | todo |
| F05 | 広告リンク先 | feed-ad-link.png | P3 | todo |
| F06 | 翻訳 | feed-translate.png | P3 | todo |

## D. リール
遷移元: リールタブ（`js/reels.js`, `js/main.js`）

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| R01 | リールのコメント | reel-comment.png | P2 | todo |
| R02 | リポスト | reel-repost.png | P3 | todo |
| R03 | 送信 | reel-send.png | P2 | todo |
| R04 | リールの···メニュー | reel-menu.png | P3 | todo |
| R05 | 友達タブ | reel-friends-tab.png | P3 | todo |

## E. 検索 / 発見
遷移元: 検索タブ（`js/explore.js`）

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| E01 | 検索結果セルタップ→投稿詳細 | explore-post.png | P2 | todo |
| E02 | 検索結果ページ | explore-results.png | P2 | todo |

## F. ストーリー / 投稿フロー
遷移元: プロフィールのハイライト / 投稿編集（`js/stories.js`, `js/main.js`）

| ID | 機能 | スクショ名 | 優先度 | 状態 |
|---|---|---|---|---|
| ST1 | ハイライトの追加 | story-highlight-add.png | P2 | todo |
| C01 | 投稿時の音源追加 | compose-music.png | P3 | todo |

---

## 進行ルール（要約 / 詳細はPLAYBOOK.md）
1. `refs/` にスクショがある todo のうち、この表で一番上の1件を選ぶ
2. 1件だけ実装 → 検証 → この表の状態を `done` に更新
3. 詰まったら `blocked` にして DEV_LOG.md に理由を書く
4. DEV_LOG.md に記録 → コミット → push → 終了（1回1機能）
