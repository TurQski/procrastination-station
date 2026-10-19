import { test, expect } from "@playwright/test";
test("dashboard gates private data and shows setup/sign-in instead of fake goals", async ({ page }) => {
  const pending = page.waitForResponse((response) => response.url().endsWith("/api/goals"));
  await page.goto("/dashboard");
  const response = await pending;
  expect([401, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
  if (response.status() === 401) await expect(page.getByRole("heading", { name: "Sign in to keep going." })).toBeVisible();
  else await expect(page.getByRole("main").getByRole("alert")).toContainText(/configured|retry|available/i);
  await expect(page.getByRole("link", { name: /Continue this goal/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("real API routes reject cross-site mutations and invalid task input", async ({ request, baseURL }) => {
  const path = "/api/tasks/a1c401f9-1dcc-452f-b2c0-f1c42f3c5534";
  const forged = await request.patch(path, { headers: { origin: "https://attacker.example" }, data: { completed: true } });
  expect(forged.status()).toBe(403);
  const invalid = await request.patch(path, { headers: { origin: baseURL! }, data: { completed: "false" } });
  expect(invalid.status()).toBe(400);
});
test("saving a preview requires authentication or explicit configuration", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("I want to…").fill("Complete my database project");
  await page.getByRole("button", { name: "Find my first step" }).click();
  const pending = page.waitForResponse((response) => response.url().endsWith("/api/goals") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Save to my goals" }).click();
  const response = await pending;
  expect([401, 503]).toContain(response.status());
  await expect(page.getByText("Not saved", { exact: true })).toBeVisible();
  await expect(page.getByText("Saved to your account.", { exact: true })).toHaveCount(0);
  if (response.status() === 401) await expect(page.getByRole("heading", { name: "Sign in to keep going." })).toBeVisible();
  else await expect(page.getByRole("main").getByRole("alert")).toContainText(/configured|retry|available/i);
});
