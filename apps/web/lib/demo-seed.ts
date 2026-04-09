import type { ThreadPost } from "@/lib/types";

/** デモ用の固定 DM ルーム（`/dm/{uuid}`）。パネル表示・シードで共有。 */
export const DEMO_DM_ROOM_YUKI = "/dm/a1111111-1111-4111-8111-111111111111";
export const DEMO_DM_ROOM_MARIN = "/dm/b2222222-2222-4222-8222-222222222222";
export const DEMO_DM_ROOM_KEN = "/dm/c3333333-3333-4333-8333-333333333333";

const DEMO_DM_PEER_BY_PATH: Record<string, string> = {
  [DEMO_DM_ROOM_YUKI]: "yuki",
  [DEMO_DM_ROOM_MARIN]: "marin",
  [DEMO_DM_ROOM_KEN]: "ken",
};

function shortDmPathLabel(path: string): string {
  const id = path.replace(/^\/dm\//, "");
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

/** デモ DM リストの表示名（相手が分かる既知ルームは名前、それ以外は UUID 短縮）。 */
export function demoDmRoomLabel(path: string): string {
  const peer = DEMO_DM_PEER_BY_PATH[path];
  if (peer) {
    return `DM · ${peer}`;
  }
  return shortDmPathLabel(path);
}

/** サイドバー・一覧用。`/dm/…` のみ人が読めるラベルにし、それ以外はパスのまま。 */
export function demoChannelSidebarLabel(path: string): string {
  return /^\/dm\//.test(path) ? demoDmRoomLabel(path) : path;
}

function slugPath(channel: string): string {
  return channel.replace(/^\//, "").replace(/\//g, "-") || "root";
}

function demoPostId(n: number): string {
  const tail = n.toString(16).padStart(12, "0");
  return `f0000000-0000-4000-8000-${tail}`;
}

function threadPost(args: {
  id: string;
  author: string;
  channel: string;
  createdAt: string;
  body: string;
  threadRootId: string;
  parentPostId: string | null;
}): ThreadPost {
  return {
    id: args.id,
    author: args.author,
    channel: args.channel,
    created_at: args.createdAt,
    updated_at: args.createdAt,
    body: args.body,
    thread_root_id: args.threadRootId,
    parent_post_id: args.parentPostId,
    markdown_path: `demo/${slugPath(args.channel)}/${args.id.slice(0, 8)}.md`,
    stamps: [],
  };
}

/**
 * Fills the in-browser demo with many threads per channel (sessionStorage sample data).
 * `rememberDmRoom` でシード済み DM をサイドパネルに並べる（最新が先頭になるよう末尾から登録する）。
 */
export function runBrowserDemoSeed(
  posts: Map<string, ThreadPost>,
  ensureChannelHierarchy: (channelPath: string) => void,
  rememberDmRoom?: (channelPath: string) => void,
): void {
  for (const ch of [
    "/general",
    "/oss/news",
    "/product/roadmap",
    "/dev/docs",
    "/ops/runbook",
    "/ops/announcements",
    "/dev/backend",
  ]) {
    ensureChannelHierarchy(ch);
  }

  const authors = [
    "yuki",
    "ken",
    "marin",
    "aya",
    "kenta",
    "jun",
    "mika",
    "tomo",
    "rina",
    "sota",
    "meilen",
    "dai",
    "nao",
    "eri",
  ];
  let idSeq = 0;
  const nextId = () => demoPostId(++idSeq);
  let minute = 240;
  const nextTs = () => {
    minute += 3;
    const d = new Date(Date.UTC(2026, 3, 1, Math.floor(minute / 60), minute % 60, 0));
    return d.toISOString();
  };
  let ai = 0;
  const nextAuthor = () => authors[ai++ % authors.length];

  function addThread(
    channel: string,
    rootBody: string,
    replies: string[],
    /** ルート投稿への直接返信（スレ内の分岐・「同じ階層の別ユーザー」向け）。 */
    moreRootReplies: string[] = [],
  ) {
    const rootId = nextId();
    posts.set(
      rootId,
      threadPost({
        id: rootId,
        author: nextAuthor(),
        channel,
        createdAt: nextTs(),
        body: rootBody,
        threadRootId: rootId,
        parentPostId: null,
      }),
    );
    let parent = rootId;
    for (const body of replies) {
      const rid = nextId();
      posts.set(
        rid,
        threadPost({
          id: rid,
          author: nextAuthor(),
          channel,
          createdAt: nextTs(),
          body,
          threadRootId: rootId,
          parentPostId: parent,
        }),
      );
      parent = rid;
    }
    for (const body of moreRootReplies) {
      const rid = nextId();
      posts.set(
        rid,
        threadPost({
          id: rid,
          author: nextAuthor(),
          channel,
          createdAt: nextTs(),
          body,
          threadRootId: rootId,
          parentPostId: rootId,
        }),
      );
    }
  }

  type DmTurn = { author: string; body: string; attachTo: "root" | "previous" };

  function addDmThread(channel: string, rootAuthor: string, rootBody: string, replies: DmTurn[]): void {
    const rootId = nextId();
    posts.set(
      rootId,
      threadPost({
        id: rootId,
        author: rootAuthor,
        channel,
        createdAt: nextTs(),
        body: rootBody,
        threadRootId: rootId,
        parentPostId: null,
      }),
    );
    let previousId = rootId;
    for (const r of replies) {
      const parentPostId = r.attachTo === "root" ? rootId : previousId;
      const rid = nextId();
      posts.set(
        rid,
        threadPost({
          id: rid,
          author: r.author,
          channel,
          createdAt: nextTs(),
          body: r.body,
          threadRootId: rootId,
          parentPostId,
        }),
      );
      previousId = rid;
    }
  }

  function registerDmRoom(path: string): void {
    ensureChannelHierarchy(path);
    rememberDmRoom?.(path);
  }

  function seedDemoDmRooms(): void {
    if (!rememberDmRoom) {
      return;
    }
    registerDmRoom(DEMO_DM_ROOM_KEN);
    addDmThread(
      DEMO_DM_ROOM_KEN,
      "ken",
      "今日のリリースタグ打った？ **v0.4.2** で合ってる？",
      [{ author: "guest", body: "うん、`git push --tags` 済み。CI の artifacts も出てる。", attachTo: "previous" }],
    );

    registerDmRoom(DEMO_DM_ROOM_MARIN);
    addDmThread(
      DEMO_DM_ROOM_MARIN,
      "marin",
      "# ルートへの並列返信デモ\n\n長いスレは **図と本文を分ける** 運用にしたい。",
      [
        { author: "guest", body: "了解。まず前提だけ整理するね。ルートは方針、返信は具体案に分けよう。", attachTo: "previous" },
        { author: "marin", body: "それでいく。Mermaid はレビュー付きで、無効環境用に PNG も併記で。", attachTo: "previous" },
        {
          author: "guest",
          body: "（ルートへの別返信）図だけ別ページにすると diff が読みやすい。**図は `docs/diagrams/`** で固定にしよう。",
          attachTo: "root",
        },
        {
          author: "tomo",
          body: "（ルートへの別返信）+1。あと **サイズ制限** を PR テンプレに一文足すの賛成。",
          attachTo: "root",
        },
      ],
    );

    registerDmRoom(DEMO_DM_ROOM_YUKI);
    addDmThread(
      DEMO_DM_ROOM_YUKI,
      "yuki",
      "Dependabot / Renovate の **grouping**、週次まとめ用のルール見てくれる？`renovate.json` 送る。",
      [
        { author: "guest", body: "いいよ。貼って。majors だけ別 PR はそのままで。", attachTo: "previous" },
        {
          author: "yuki",
          body: "送った。`packageRules` の patch/minor グループだけ先にレビューしてほしい。",
          attachTo: "previous",
        },
        {
          author: "guest",
          body: "確認した。**週次PR1本** にまとまってる。security だけ即時みたいな override も入ってて OK。",
          attachTo: "previous",
        },
      ],
    );
    addDmThread(
      DEMO_DM_ROOM_YUKI,
      "guest",
      "SBOM の artifact 名、チームで揃えたい。**命名ルール** ある？",
      [
        {
          author: "yuki",
          body: "`sbom-<service>-<git-short-sha>.json` で統一してる。元データは Syft。",
          attachTo: "previous",
        },
        { author: "guest", body: "了解、それに合わせる。README に一文足しとく。", attachTo: "previous" },
      ],
    );
  }

  // --- /general ---
  addThread(
    "/general",
    "# 今週ピックアップした OSS ネタ\n\nよく見ているリポジトリの **Releases / Security** をざっと眺めたメモ（デモ用）。\n\n- ランタイム: **Security 節** から読む\n- ライブラリ: **破壊的変更の章** を通読\n- 供給鎖: **SBOM / 依存グラフ差分** を残す\n\nコツを募集中。",
    [
      "**Watch を Releases only** にして週一回まとめ視聴。**Dependabot / Renovate の CVE リンク** から辿ると影響判断が早いです。",
      "セキュリティパッチは **適用順序** をチケットに書いてからマージするルールにしてます。",
      "各リリースごとに SBOM を **CI Artifact** に載せるようにしました。",
    ],
    [
      "（ルートへの別返信）**GHSA だけ** 見て飛ばすのは危ないので、Upstream の release 本文もついでに確認する派です。",
      "（ルートへの別返信）SBOM は ** SPDX 形式** と CycloneDX のどちらを正にするか、一回決めた方が交換がラクでした。",
    ],
  );
  addThread(
    "/general",
    "# ライセンス変更ニュースの切り分け\n\n「コア OSS、周辺商用」パターン増。**どのバイナリに何のライセンスか** を表にすると議論がズレません。",
    [
      "SPDX と `NOTICE` 有無だけの **社内テンプレ** を法務と共有してます。",
      "配布 zip 単位で **ファイル一覧** を添えてレビュー依頼してます。",
      "「ソース公開の範囲」が曖昧なときは **ビルドパイプラインの成果物** で線を引きます。",
    ],
  );
  addThread(
    "/general",
    "# CI: main 直コミット禁止にした話\n\n全員 **PR 必須**、ブロックは **lint / test / typecheck**。**レビュアー2名** は運用で調整中。",
    [
      "**Squash merge** で履歴を細く。**Revert PR** の手順だけ runbook にリンク。",
      "緊急ホットフィックス用に **bypass ラベル** は残すが回数を KPI に。",
    ],
  );
  addThread(
    "/general",
    "# オンボーディング用 Markdown の置き場所\n\n`docs/onboarding/` を正とし、毎回更新するときは **スレに diff の要約** を貼るルールにしたい。",
    [
      "最初の一週間用 **チェックリスト** と、その後の **深掘りリンク集** を分けました。",
      "図が必要なら **Mermaid はレビュー付き** で、mermaid 無効環境向けに PNG も。",
    ],
  );
  addThread(
    "/general",
    "# 朝会メモ（テンプレ）\n\n昨日の完了 / 今日の予定 / ブロッカー。**ログ・リリース・API** のキーワードは箇条書きで。",
    [
      "ブロッカーは **誰がいつまでに何をするか** まで落とす。",
      "**スレッドは1トピック1スレ** で切り直すのが読みやすいです。",
    ],
  );
  addThread(
    "/general",
    "# 雑談: 外部 API レート制限でハマった\n\n最初に **ステータス行だけ** 抜き出して貼ると、後からログ追うとき迷子になりにくい。",
    [
      "**Retry-After** と **X-RateLimit-*** をテーブルにして README に。",
      "バースト用に **キュー** を挟むか、同期呼び出しをやめるかは別スレで。",
    ],
  );
  addThread(
    "/general",
    "# AI の分類: フィジカル vs ノン・フィジカル\n\n「AI とロボティクス」より、**現実世界と観測・行動で閉ループするか**で切ると、要件と失敗モードの話が噛み合いやすい（デモ用メモ）。\n\n| | フィジカル AI | ノン・フィジカル AI |\n| --- | --- | --- |\n| 典型 | ロボ、組み込み、ライン制御、一部ウェアラブル | LLM エージェント、推薦、コード支援 |\n| 論点 | 安全、レイテンシ、シミュ↔実機 | コンテキスト、幻覚、データ権利 |",
    [
      "補助軸は **エッジ／クラウド** と **閉ループのどこに人が入るか** を分けた。ロボはフィジカル側の実装の一種。",
      "境界はグラデーション。**API 越しに現場デバイスを動かす**ときは「どこまでをフィジカル扱いにするか」を一度ラベルで固定した。",
    ],
    [
      "（ルートへ）社内テンプレでは **Primary: フィジカル／ノン・フィジカル**、**Secondary: ロボ・組み込み・クラウド** の二段にしたらレビューが速くなった。",
    ],
  );

  // --- /oss/news ---
  addThread(
    "/oss/news",
    "# OSS 短報メモの書き方\n\n**CHANGELOG の一行** をコピペ + 一言。**リリース日** と **セキュリティ有無** を併記。",
    [
      "CVE 番号が出たら **GHSA リンク** も。",
      "影響自作サービスがあるかは **別列** にメモ。",
    ],
  );
  addThread(
    "/oss/news",
    "# 今週のセキュリティ週報リンク集\n\n公式 Advisory / メーリングリスト / まとめサイトから **一次情報** を優先。",
    [
      "まとめサイトは **出典 URL** を必ず残す。",
      "読みたいが長い記事は **要約だけ** 引用してフルはリンク。",
    ],
  );
  addThread(
    "/oss/news",
    "# メジャーバージョンアップ検知の仕掛け\n\n**Renovate のグルーピング** と **週次レビュー会** の運用メモ。",
    [
      "メジャーだけ **別 PR** に分けるルールにした。",
      "Breaking は **マイグレーション章へのリンク** を PR テンプレに。",
    ],
  );
  addThread(
    "/oss/news",
    "# ライブラリ A のパフォーマンス改善リリース\n\nベンチ数値が README に。**マルチスレッド** 周りの注意がリリースノートに明記。",
    [
      "自作 **ベンチスイート** で再計測したら ±5% 以内でした。",
    ],
  );
  addThread(
    "/oss/news",
    "# 「メンテモード宣言」が増えた印象\n\nアーカイブ方針と **推奨フォーク** の記載があるかチェック項目に追加。",
    [
      "社内ミラー方針と **セキュリティパッチの取り込み** 手順をセットで。",
    ],
  );

  // --- /product/roadmap ---
  addThread(
    "/product/roadmap",
    "# 今四半期のリリース方針\n\n破壊的変更は **リリースノート冒頭**。**Markdown テンプレ** で共有。",
    [
      "**ログの後方互換** 注意は同じファイルの「運用」節へ。",
      "顧客向け **メール草案** は別チャンネルでレビュー。",
    ],
  );
  addThread(
    "/product/roadmap",
    "# 機能フラグの廃止タイムライン\n\n**公開予定日** と **強制オン日** を表で管理。オフに戻す手順も。",
    [
      "強制オン前に **メトリクス閾値** を合意。",
    ],
  );
  addThread(
    "/product/roadmap",
    "# ユーザーヒアリングのメモ共有\n\nインタビュー ID だけ振って **要点3つ** をスレに。録音 URL は別ストレージ。",
    [
      "**ペイン / 現状ワークアラウンド / 期待** の3列で整理。",
      "優先度は **RICE** で次回プロダクト定例に持ち込み。",
    ],
  );
  addThread(
    "/product/roadmap",
    "# 価格改定とコミュニケーション\n\nFAQ 草案と **サポート体制** の増員要否。",
    [
      "既存契約の **グランドファザー条件** を表に。",
    ],
  );
  addThread(
    "/product/roadmap",
    "# モバイル版ロードマップ（β）\n\n**オフライン** と **プッシュ** の段階的リリース案。",
    [
      "β ユーザー **募集条件** は法務確認済み。",
    ],
  );

  // --- /dev/docs ---
  addThread(
    "/dev/docs",
    "# API リファレンスとログの対応表\n\nエンドポイントごとに **リクエスト例** と **失敗時ログコード** を Markdown 表で。",
    [
      "**4xx / 5xx** ごとに「ユーザー向け表示」「内部メモ」を分ける。",
      "OpenAPI の **example** フィールドと同期する運用に。",
    ],
    ["（ルートへ）表の **列名は英語固定** にして、説明は別列で i18n 対応にした。"],
  );
  addThread(
    "/dev/docs",
    "# 認証フロー図の置き場\n\nシーケンスは Mermaid、**トークン寿命** は表。",
    [
      "ローテーション時の **クロックスキュー** 注意を脚注に。",
    ],
  );
  addThread(
    "/dev/docs",
    "# エラーコード設計ガイド\n\n`ERR_` プレフィックスと **HTTP ステータス** のマッピング。",
    [
      "クライアントは **retry 可能か** をフラグで返す案。",
      "**i18n メッセージキー** は別表。",
    ],
  );
  addThread(
    "/dev/docs",
    "# SDK リリースノートのテンプレ\n\nBreaking / Deprecation / 移行手順の **見出し固定**。",
    [
      "生成コード差分は **CI で snippet** をコメントに。",
    ],
  );
  addThread(
    "/dev/docs",
    "# 内部アーキテクチャ Decision Log\n\n**コンテキスト / 決定 / 結果** の3段。代替案は箇条書き。",
    [
      "**リバース可能期限** を書いておくと後で楽。",
    ],
  );

  // --- /ops/runbook ---
  addThread(
    "/ops/runbook",
    "# 障害時ファーストレスポンス\n\n影響時間帯の **ログをそのまま貼る**。**リリース直後** だけログレベル上げ手順は別ページへリンク。",
    [
      "**ステークホルダー通知** のテンプレは status@ の下書きに。",
      "ポストモーテムは **5 Whys** は軽く、**再発防止タスク** をチケット化まで。",
    ],
  );
  addThread(
    "/ops/runbook",
    "# DB フェイルオーバー演習メモ\n\n**RTO/RPO** の実測値とギャップ。",
    [
      "接続プールの **タイムアウト** 設定見直しリスト。",
    ],
  );
  addThread(
    "/ops/runbook",
    "# 証明書更新 Runbook\n\n**90 / 30 / 7 日前** アラートと手動確認コマンド。",
    [
      "Let's Encrypt と社内 CA で **手順分岐** を明記。",
    ],
  );
  addThread(
    "/ops/runbook",
    "# ディスク使用率アラート対応\n\n**ログローテーション** と **一時ファイル** の掃除順。",
    [
      "閾値は **環境別** に調整済み。",
    ],
  );
  addThread(
    "/ops/runbook",
    "# 依存サービス障害時の降格モード\n\n**機能フラグ** と **キャッシュ TTL** の緊急値。",
    [
      "顧客向け **ステータス文言** は PR テンプレにある。",
    ],
  );

  // --- /ops/announcements ---
  addThread(
    "/ops/announcements",
    "# チャット内容は知識ベース化します\n\n結論・前提を **Markdown で残す** 運用のお願い。",
    [
      "長文は **スレッド** ではなくチャンネル分け or 別ファイルに。",
    ],
  );
  addThread(
    "/ops/announcements",
    "# メンテナンスウィンドウ（予告）\n\n**日時（UTC）** と **影響範囲**、ロールバック方針。",
    [
      "読み込み専用モードに入る **判定条件** も記載。",
    ],
  );
  addThread(
    "/ops/announcements",
    "# 新しいバックアップ保持期間\n\n**法规制** に沿った日数への変更とリストア演習予定。",
    [
      "異なるリージョンへの **コピー先** は別表。",
    ],
  );

  // --- /dev/backend ---
  addThread(
    "/dev/backend",
    "# API レート制限とログの見方\n\nまず **ステータス行** だけ切り出し、**本文は後追い**。外部 API の仕様表へリンク。",
    [
      "**指数バックオフ** のパラメータは設定ファイルにコメント。",
      "サーキットブレーカー **半開** のメトリクスをダッシュボードに。",
    ],
  );
  addThread(
    "/dev/backend",
    "# トランザクション境界の整理\n\n**Outbox** パターン導入エリアと **冪等キー** の扱い。",
    [
      "非同期処理は **at-least-once** 前提で重複排除。",
    ],
  );
  addThread(
    "/dev/backend",
    "# キャッシュレイヤーの TTL 設計\n\n**読み取り多** と **整合性クリティカル** で階層分け。",
    [
      "Invalidate は **イベント** 駆動 + 定期フル同期のハイブリッド。",
    ],
  );
  addThread(
    "/dev/backend",
    "# DB マイグレーションのレビュー観点\n\n**ロック時間** と **バックフィルのバッチサイズ**。",
    [
      "大規模テーブルは **オンライン DDL** の可否を先に。",
    ],
  );
  addThread(
    "/dev/backend",
    "# gRPC vs REST の境界\n\n**社内呼び出し** は gRPC、**公開 API** は REST+OpenAPI。",
    [
      "エラー表現の **共通型** を proto で共有。",
    ],
  );
  addThread(
    "/dev/backend",
    "# ワーカーのスケーリングメモ\n\n**キュー深さ** と **CPU** の目安、**デッドレター** の巡回。",
    [
      "再処理は **指数ジッター** 付きリトライ。",
    ],
  );
  addThread(
    "/dev/backend",
    "# 観測可能性バックエンド比較（メモ）\n\n**コスト** と **クエリ言語**、トレースの **サンプリング率**。",
    [
      "個人データは **マスキング** ルールを最初に。",
    ],
  );

  /* 一覧先頭に出す「最初に触る」スレ（タイムスタンプを新しくする） */
  minute = 9200;
  addThread(
    "/general",
    "# まずここから · Start here · 30秒デモ\n\n**左** ワークスペース（個別チャット付き） → **中央** スレ一覧 → **右** 会話と **要約 / 返信ドラフト**。  \nこのスレを開いたまま、右の **要約** → **返信ドラフト** を順に押してみてください。\n\n- データは **このタブだけ**（閉じると消えます）\n- 本番は README の Docker / API から",
    [
      "yuki: いま **#general** の最新スレがこれ。検索バーで `SBOM` とか打っても遊べるよ。",
      "ken: スタンプはログイン不要のデモ用キーで押せる。**自分の表示名** はコンポーザーで変えてOK。",
    ],
    [
      "marin: （ルートへの返信）DM は **DM · yuki** から。往復メモが既に入ってる。",
    ],
  );

  seedDemoDmRooms();
}
