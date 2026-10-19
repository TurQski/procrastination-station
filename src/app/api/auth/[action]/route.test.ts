import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/supabase", () => ({ serverClient: vi.fn() }));
import { serverClient } from "@/lib/server/supabase";
import { POST, GET } from "./route";
const auth = { signInWithOtp: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(), signOut: vi.fn() };
const context = (action: string) => ({ params: Promise.resolve({ action }) });
const req = (data: unknown) => new Request("http://localhost:3000/api/auth/code", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("APP_ORIGIN", "http://localhost:3000"); vi.stubEnv("AUTH_ALLOW_SIGNUP", "false");
  vi.mocked(serverClient).mockResolvedValue({ auth } as unknown as Awaited<ReturnType<typeof serverClient>>);
});
afterEach(() => vi.unstubAllEnvs());
describe("email authentication route contracts", () => {
  it("keeps public signup off and returns no token to the browser", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    const response = await POST(req({ email: "tester@example.com" }), context("code"));
    expect(response.status).toBe(200);
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: "tester@example.com", options: { shouldCreateUser: false } });
    expect(await response.json()).toEqual({ ok: true });
  });
  it("handles built-in sender rate limits", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { status: 429 } });
    expect((await POST(req({ email: "tester@example.com" }), context("code"))).status).toBe(429);
  });
  it("does not accept expired email codes", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: { status: 403 } });
    expect((await POST(req({ email: "tester@example.com", token: "123456" }), context("verify"))).status).toBe(400);
  });
  it("returns only user identity after verification", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: { id: "user-a", email: "tester@example.com" }, session: { access_token: "must-not-be-returned" } }, error: null });
    const response = await POST(req({ email: "tester@example.com", token: "123456" }), context("verify"));
    expect(await response.json()).toEqual({ user: { id: "user-a", email: "tester@example.com" } });
  });
  it("treats an expired session as signed out but a provider outage as retryable", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    expect(await (await GET(new Request("http://localhost:3000"), context("session"))).json()).toEqual({ user: null });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 0 } });
    expect((await GET(new Request("http://localhost:3000"), context("session"))).status).toBe(503);
  });
});
