import { test, expect } from "@playwright/test";

test.describe("Customer Flow", () => {
  test("landing page loads and shows hero", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("جاكسي").first()).toBeVisible();
    await expect(page.getByText(/perfect look|best place/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /book now/i }).first()).toBeVisible();
  });

  test("book now links to join page", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: /book now/i }).first().click();
    await page.waitForURL("/en/join");
    await expect(page.getByRole("heading", { name: /book your spot/i })).toBeVisible();
  });

  test("join page shows form with name and phone", async ({ page }) => {
    await page.goto("/en/join");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /book now/i })).toBeVisible();
  });

  test("dashboard requires password", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
