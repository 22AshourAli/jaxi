import { test, expect } from "@playwright/test";

test.describe("Barber / Dashboard Flow", () => {
  test("dashboard shows password login form", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/wrong password/i)).toBeVisible();
  });

  test("correct password logs in and shows queue", async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.getByLabel(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    // After login, should see queue management
    await expect(page.getByRole("button", { name: /call next/i })).toBeVisible({ timeout: 10000 });
  });
});
