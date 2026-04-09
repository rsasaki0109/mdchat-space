import { expect, test } from "@playwright/test";

/**
 * UI E2E (Japanese `/`). Seeds a post via HTTP so we exercise the real API + DB,
 * then asserts channel navigation, thread list, and Summarize → AI Summary.
 *
 * Prerequisites:
 * - FastAPI at `MDCHAT_API_URL` (default `http://127.0.0.1:8000`) with Postgres + seed optional.
 * - Playwright starts Next via `playwright.config.ts` unless `MDCHAT_NO_WEB_SERVER=1`.
 */

const apiBase = (process.env.MDCHAT_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

let seedMarker: string;

test.beforeAll(async ({ request }) => {
  let res: Response;
  try {
    res = await fetch(`${apiBase}/health`);
  } catch (err) {
    throw new Error(`E2E requires a running API at ${apiBase}. ${String(err)}`);
  }
  if (!res.ok) {
    throw new Error(`E2E API /health failed: ${res.status} (${apiBase})`);
  }
  const health = (await res.json()) as { status?: string };
  if (health.status !== "ok") {
    throw new Error(`E2E API /health unexpected body: ${JSON.stringify(health)}`);
  }

  seedMarker = `e2e-seed-${Date.now()}`;
  const create = await request.post(`${apiBase}/posts`, {
    headers: { "Content-Type": "application/json" },
    data: {
      author: "e2e",
      channel: "/e2e/play",
      body: `${seedMarker}\n\nPlaywright E2E seeded thread.`,
    },
  });
  if (!create.ok()) {
    const detail = await create.text();
    throw new Error(`E2E seed POST /posts failed: ${create.status()} ${detail}`);
  }
});

test.describe("dashboard (ja)", () => {
  test("channel tree, thread from seed, summarize", async ({ page }) => {
    test.setTimeout(90_000);

    const treeLoaded = page.waitForResponse(
      (response) => response.url().includes("/channels/tree") && response.ok(),
      { timeout: 60_000 },
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await treeLoaded;

    await expect(page.getByRole("heading", { name: "会話のディレクトリ" })).toBeVisible();
    const channelButton = page.getByRole("button", { name: "/e2e/play", exact: true });
    await expect(channelButton).toBeVisible({ timeout: 60_000 });

    await channelButton.click();

    await expect(page.getByRole("heading", { name: "投稿一覧" })).toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(seedMarker) })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("button", { name: "要約" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "要約" }).click();
    await expect(page.getByText("AI Summary", { exact: true })).toBeVisible({ timeout: 30_000 });
  });
});
