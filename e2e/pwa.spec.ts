import { test, expect } from "@playwright/test";

test.describe("PWA", () => {
  test("manifest.webmanifest returns valid manifest", async ({ page }) => {
    const response = await page.goto("/manifest.webmanifest");
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest).toHaveProperty("name");
    expect(manifest).toHaveProperty("start_url");
    expect(manifest).toHaveProperty("display", "standalone");
    expect(manifest).toHaveProperty("icons");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test("sw.js is accessible", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
    const text = await response?.text();
    expect(text).toContain("self.addEventListener");
  });

  test("service worker registers successfully", async ({ page }) => {
    await page.goto("/en");
    // Wait for registration and activated state
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active?.state === "activated";
    });
    // Verify controller is set
    expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe("activated");
  });
});
