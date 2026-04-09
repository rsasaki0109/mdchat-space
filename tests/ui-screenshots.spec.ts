import { expect, test } from "@playwright/test";
import path from "node:path";

const shotRoot = path.join(__dirname, "..", "docs", "screenshots");

const locales = [
  { code: "ja" as const, query: "", summarize: "要約" },
  { code: "en" as const, query: "?lang=en", summarize: "Summarize" },
];

for (const { code, query, summarize } of locales) {
  test.describe(`README screenshots (${code})`, () => {
    test("dashboard and thread summary", async ({ page }) => {
      test.setTimeout(60_000);

      await page.goto(query ? `/${query}` : "/", { waitUntil: "domcontentloaded" });
      const threadHeading = code === "en" ? "Threads" : "投稿一覧";
      await expect(page.getByRole("heading", { name: threadHeading })).toBeVisible();

      await page.screenshot({
        path: path.join(shotRoot, code, "dashboard.png"),
        fullPage: true,
      });

      await expect(page.getByRole("button", { name: summarize })).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: summarize }).click();
      await expect(page.getByText("AI Summary", { exact: true })).toBeVisible({ timeout: 20_000 });

      await page.screenshot({
        path: path.join(shotRoot, code, "thread-summary.png"),
        fullPage: true,
      });
    });
  });
}
