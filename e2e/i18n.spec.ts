import { test, expect } from "@playwright/test";

test.describe("i18n — Arabic / English", () => {
  test("default locale is Arabic for Arabic-preference browser", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ar-SA" });
    const arPage = await context.newPage();
    await arPage.goto("/");
    await expect(arPage).toHaveURL(/\/ar/);
    await expect(arPage.locator("html")).toHaveAttribute("lang", "ar");
    await context.close();
  });

  test("English page renders in English", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText(/perfect look|best place/i)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("Arabic page renders in Arabic", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.getByText(/إطلالتك المثالية|حلاقة عصرية/i)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("RTL direction is applied for Arabic", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("LTR direction for English", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
