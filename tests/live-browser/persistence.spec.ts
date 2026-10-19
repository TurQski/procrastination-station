import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// Opt-in only. Never record traces, screenshots, input values, cookies, or sessions.
test("live password sign-in, refresh persistence, progress, sign-out, isolation, and deletion", async ({ page, context }) => {
  const title = `Browser verification ${randomUUID()}`;
  let goalPath = "";
  async function signIn(user: "A" | "B") {
    await expect(page.getByRole("heading", { name: "Sign in to keep going." })).toBeVisible();
    await page.getByLabel("Email address", { exact: true }).fill(process.env[`SUPABASE_TEST_USER_${user}_EMAIL`]!);
    await page.getByLabel("Password", { exact: true }).fill(process.env[`SUPABASE_TEST_USER_${user}_PASSWORD`]!);
    const response = page.waitForResponse((r) => r.url().endsWith("/api/auth/signin") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    expect((await response).status()).toBe(200);
  }
  async function signOut() {
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL("/");
    expect((await page.request.get("/api/goals")).status()).toBe(401);
    const session = await (await page.request.get("/api/auth/session")).json();
    expect(session.user).toBeNull();
  }
  try {
    await page.goto("/dashboard");
    await signIn("A");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    const sessionCookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
    expect(sessionCookies.length > 0).toBe(true);
    expect(sessionCookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
    expect(await page.evaluate(() => document.cookie.includes("auth-token"))).toBe(false);
    await page.goto("/");
    await page.locator("#goal").fill(title);
    await page.getByRole("button", { name: "Find my first step" }).click();
    await page.getByRole("button", { name: "Save to my goals" }).click();
    const savedLink = page.getByRole("link", { name: /Open saved goal/ });
    await expect(savedLink).toBeVisible();
    goalPath = (await savedLink.getAttribute("href"))!;
    await savedLink.click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(5);
    await page.getByRole("checkbox").first().click();
    await expect(page.getByText("20%", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();
    await expect(page.getByText("20%", { exact: true })).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
    await signOut();
    await page.goto(goalPath);
    await signIn("B");
    await expect(page.getByRole("heading", { name: /That goal/ })).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    const hidden = await page.request.get(`/api/goals/${goalPath.split("/").pop()}`);
    expect(hidden.status()).toBe(404);
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);
    await signOut();
    await page.goto("/dashboard");
    await signIn("A");
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
    await page.goto(goalPath);
    await page.getByRole("button", { name: "Delete goal", exact: true }).click();
    await page.getByRole("button", { name: "Yes, delete this goal", exact: true }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);
    expect((await page.request.get(`/api/goals/${goalPath.split("/").pop()}`)).status()).toBe(404);
    await signOut();
  } finally {
    // Clean up only this uniquely named disposable goal if a UI assertion failed.
    const cleanup = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const login = await cleanup.auth.signInWithPassword({ email: process.env.SUPABASE_TEST_USER_A_EMAIL!, password: process.env.SUPABASE_TEST_USER_A_PASSWORD! });
    if (login.error) throw new Error("Live browser cleanup could not authenticate the test account.");
    const removed = await cleanup.from("goals").delete().eq("title", title);
    await cleanup.auth.signOut({ scope: "local" });
    if (removed.error) throw new Error("Disposable browser goal cleanup failed; review the development database.");
  }
});
