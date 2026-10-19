import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { body, handle, ApiError, assertSameOrigin } from "./http";
import { updateTaskSchema } from "@/lib/validation";
beforeEach(() => vi.stubEnv("APP_ORIGIN", "http://localhost:3000"));
afterEach(() => vi.unstubAllEnvs());
function request(data: string, origin = "http://localhost:3000") { return new Request("http://localhost:3000/api/tasks/test", { method: "PATCH", headers: { origin, "content-type": "application/json" }, body: data }); }
describe("API boundary", () => {
  it("accepts same-origin JSON", async () => expect(await body(request('{"completed":false}'), updateTaskSchema)).toEqual({ completed: false }));
  it("rejects missing and cross-site origins", () => {
    expect(() => assertSameOrigin(new Request("http://localhost:3000"))).toThrow(ApiError);
    expect(() => assertSameOrigin(request("{}", "https://attacker.example"))).toThrow(ApiError);
  });
  it("handles the external Host when Next normalizes the internal URL", () => {
    vi.stubEnv("APP_ORIGIN", "");
    expect(() => assertSameOrigin(new Request("http://localhost:3000/api/goals", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } }))).not.toThrow();
  });
  it("rejects oversized bodies even with no content-length header", async () => expect(body(request('"' + 'x'.repeat(17_000) + '"'), updateTaskSchema)).rejects.toMatchObject({ status: 413 }));
  it("rejects malformed JSON", async () => expect(body(request("{"), updateTaskSchema)).rejects.toMatchObject({ status: 400 }));
  it("returns private no-store errors without leaking provider details", async () => {
    const result = await handle(async () => { throw new Error("private provider detail"); });
    expect(result.status).toBe(503);
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(await result.text()).not.toContain("private provider detail");
  });
});
