import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/supabase", () => ({ requireUser: vi.fn() }));
import { requireUser } from "@/lib/server/supabase";
import { ApiError } from "@/lib/server/http";
import { GET, POST } from "./route";
import { GET as getGoal, PATCH, DELETE } from "./[id]/route";
import { PATCH as patchTask } from "../tasks/[id]/route";
const id = "a1c401f9-1dcc-452f-b2c0-f1c42f3c5534";
const context = { params: Promise.resolve({ id }) };
// These are isolated handler contract tests, not a mock persistence implementation.
function chain(data: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), delete: vi.fn(), order: vi.fn(), maybeSingle: vi.fn() };
  for (const key of ["select", "eq", "update", "delete"] as const) query[key].mockReturnValue(query);
  for (const key of ["order", "maybeSingle"] as const) query[key].mockResolvedValue({ data, error: null });
  return query;
}
function authenticate(query: ReturnType<typeof chain>, rpc = vi.fn()) {
  const client = { from: vi.fn().mockReturnValue(query), rpc };
  vi.mocked(requireUser).mockResolvedValue({ client, user: { id: "owner-a" } } as unknown as Awaited<ReturnType<typeof requireUser>>);
  return client;
}
function req(method: string, data?: unknown) { return new Request("http://localhost:3000/api/goals", { method, headers: { origin: "http://localhost:3000", "content-type": "application/json" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) }); }
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("APP_ORIGIN", "http://localhost:3000"); });
afterEach(() => vi.unstubAllEnvs());
describe("authenticated CRUD route contracts", () => {
  it("denies unauthenticated reads", async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError(401, "Sign in."));
    expect((await GET()).status).toBe(401);
  });
  it("scopes goal lists to the verified owner", async () => {
    const query = chain([]); authenticate(query);
    expect((await GET()).status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner-a");
  });
  it("creates through one transactional RPC with server-generated tasks", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: id, error: null }); authenticate(chain(null), rpc);
    const today = new Date().toISOString().slice(0, 10);
    const response = await POST(req("POST", { goal: "Finish the essay", minutes: 60, startDate: today, targetDate: today }));
    expect(response.status).toBe(201);
    const args = rpc.mock.calls[0][1];
    expect(args.p_tasks).toHaveLength(5);
    expect(args).not.toHaveProperty("user_id");
    expect(args.p_tasks.reduce((n: number, task: { estimated_minutes: number }) => n + task.estimated_minutes, 0)).toBe(60);
  });
  it("rejects forged ownership before touching the database", async () => {
    const response = await POST(req("POST", { goal: "Finish the essay", minutes: 60, startDate: "2026-10-18", targetDate: "2026-10-19", user_id: "someone-else" }));
    expect(response.status).toBe(400); expect(requireUser).not.toHaveBeenCalled();
  });
  it("returns indistinguishable not-found responses for unavailable goal reads, updates and deletes", async () => {
    const query = chain(null); authenticate(query);
    expect((await getGoal(req("GET"), context)).status).toBe(404);
    expect((await PATCH(req("PATCH", { title: "Updated goal title" }), context)).status).toBe(404);
    expect((await DELETE(req("DELETE"), context)).status).toBe(404);
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner-a");
  });
  it("returns successful owned goal updates and deletes", async () => {
    const query = chain({ id, tasks: [] }); authenticate(query);
    expect((await PATCH(req("PATCH", { description: "A note" }), context)).status).toBe(200);
    expect(query.update).toHaveBeenCalledWith({ description: "A note" });
    expect((await DELETE(req("DELETE"), context)).status).toBe(200);
  });
  it("updates completion and treats an RLS-filtered task as not found", async () => {
    const query = chain({ id, completed: true }); authenticate(query);
    expect((await patchTask(req("PATCH", { completed: true }), context)).status).toBe(200);
    expect(query.update).toHaveBeenCalledWith({ completed: true });
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await patchTask(req("PATCH", { completed: false }), context)).status).toBe(404);
  });
  it("rejects a foreign origin before deletion", async () => {
    const response = await DELETE(new Request("http://localhost:3000/api/goals", { method: "DELETE", headers: { origin: "https://attacker.example" } }), context);
    expect(response.status).toBe(403); expect(requireUser).not.toHaveBeenCalled();
  });
});
