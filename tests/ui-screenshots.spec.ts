import { expect, test } from "@playwright/test";
import path from "node:path";

const shotDir = path.join(__dirname, "..", "docs", "screenshots");

test.describe("README screenshots", () => {
  test("dashboard and thread summary", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "投稿一覧" })).toBeVisible();
    await expect(page.getByRole("button", { name: "要約" })).toBeVisible({ timeout: 30_000 });

    await page.screenshot({
      path: path.join(shotDir, "dashboard.png"),
      fullPage: true,
    });

    await page.getByRole("button", { name: "要約" }).click();
    await expect(page.getByText("AI Summary", { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.screenshot({
      path: path.join(shotDir, "thread-summary.png"),
      fullPage: true,
    });
  });
});
