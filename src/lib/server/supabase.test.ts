import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverClient, requireUser } from "./supabase";
const getUser = vi.fn(); const setCookie = vi.fn();
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("SUPABASE_URL", "https://test-project.supabase.co"); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_placeholder");
  vi.mocked(cookies).mockResolvedValue({ getAll: () => [], set: setCookie } as unknown as Awaited<ReturnType<typeof cookies>>);
  vi.mocked(createServerClient).mockReturnValue({ auth: { getUser } } as unknown as ReturnType<typeof createServerClient>);
});
afterEach(() => vi.unstubAllEnvs());
describe("server-only session boundary", () => {
  it("rejects missing configuration and privileged/non-publishable keys", async () => {
    for (const key of ["", "not-a-publishable-key"]) {
      vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", key);
      await expect(serverClient()).rejects.toMatchObject({ status: 503 });
    }
    expect(createServerClient).not.toHaveBeenCalled();
  });
  it("enforces HttpOnly and SameSite cookies and Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production"); await serverClient();
    const options = vi.mocked(createServerClient).mock.calls[0][2];
    expect(options?.cookieOptions).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  });
  it("validates the user remotely and rejects an expired session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
    getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
    expect((await requireUser()).user.id).toBe("verified-user");
    expect(getUser).toHaveBeenCalledTimes(2);
  });
});
