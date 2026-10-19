import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/supabase", () => ({ serverClient: vi.fn() }));
import { serverClient } from "@/lib/server/supabase";
import { POST, GET } from "./route";
const auth = { signInWithPassword: vi.fn(), getUser: vi.fn(), signOut: vi.fn() };
const context = (action: string) => ({ params: Promise.resolve({ action }) });
const req = (data: unknown) => new Request("http://localhost:3000/api/auth/signin", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  vi.mocked(serverClient).mockResolvedValue({ auth } as unknown as Awaited<ReturnType<typeof serverClient>>);
});
afterEach(() => vi.unstubAllEnvs());
describe("password authentication route contracts", () => {
  it("signs into an existing account and returns identity without session tokens", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "user-a", email: "tester@example.com" }, session: { access_token: "must-not-be-returned" } }, error: null });
    const response = await POST(req({ email: "tester@example.com", password: "private test value" }), context("signin"));
    expect(response.status).toBe(200);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "tester@example.com", password: "private test value" });
    expect(await response.json()).toEqual({ user: { id: "user-a", email: "tester@example.com" } });
  });
  it("rejects invalid credentials without exposing provider details", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status: 400, message: "private provider detail" } });
    const response = await POST(req({ email: "tester@example.com", password: "wrong" }), context("signin"));
    expect(response.status).toBe(401);
    expect(JSON.stringify(await response.json())).not.toContain("private provider detail");
  });
  it("handles rate limits and provider outages", async () => {
    for (const status of [429, 503]) {
      auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status } });
      expect((await POST(req({ email: "tester@example.com", password: "test" }), context("signin"))).status).toBe(status);
    }
  });
  it("rejects empty passwords and removed code/signup endpoints", async () => {
    expect((await POST(req({ email: "tester@example.com", password: "" }), context("signin"))).status).toBe(400);
    for (const action of ["code", "verify", "signup"]) expect((await POST(req({}), context(action))).status).toBe(404);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("enforces origin checking before using credentials", async () => {
    const request = new Request("http://localhost:3000/api/auth/signin", { method: "POST", headers: { origin: "https://other.example", "content-type": "application/json" }, body: JSON.stringify({ email: "tester@example.com", password: "test" }) });
    expect((await POST(request, context("signin"))).status).toBe(403);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("signs out the current browser and reports provider failures", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    expect((await POST(req({}), context("signout"))).status).toBe(200);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    auth.signOut.mockResolvedValue({ error: { status: 500 } });
    expect((await POST(req({}), context("signout"))).status).toBe(503);
  });
  it("treats an expired session as signed out but a provider outage as retryable", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    expect(await (await GET(new Request("http://localhost:3000"), context("session"))).json()).toEqual({ user: null });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 0 } });
    expect((await GET(new Request("http://localhost:3000"), context("session"))).status).toBe(503);
  });
});
