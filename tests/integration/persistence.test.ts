import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const prefix = `Integration check ${randomUUID()}`;
let a: SupabaseClient, b: SupabaseClient, anonymous: SupabaseClient;
let goalId: string, taskId: string;
let ready = false;
const today = new Date().toISOString().slice(0, 10);
const tasks = Array.from({ length: 5 }, (_, index) => ({ title: `Stage ${index + 1}`, description: "Disposable live test", estimated_minutes: 12, due_date: today }));
function client() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
async function login(target: SupabaseClient, user: "A" | "B") {
  const { data, error } = await target.auth.signInWithPassword({ email: process.env[`SUPABASE_TEST_USER_${user}_EMAIL`]!, password: process.env[`SUPABASE_TEST_USER_${user}_PASSWORD`]! });
  if (error || !data.user) throw new Error(`Could not authenticate configured test user ${user}. Check the confirmed account and password.`);
  return data.user;
}
beforeAll(async () => {
  const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_TEST_USER_A_EMAIL", "SUPABASE_TEST_USER_A_PASSWORD", "SUPABASE_TEST_USER_B_EMAIL", "SUPABASE_TEST_USER_B_PASSWORD"];
  if (required.some((key) => !process.env[key])) throw new Error("Live Supabase verification requires a configured dev project and two confirmed test accounts. See docs/SUPABASE-SETUP.md. No live verification has run.");
  if (!process.env.SUPABASE_PUBLISHABLE_KEY!.startsWith("sb_publishable_")) throw new Error("Use a publishable key, never an administrator key.");
  a = client(); b = client(); anonymous = client();
  const userA = await login(a, "A"); const userB = await login(b, "B");
  if (userA.id === userB.id) throw new Error("Two distinct test accounts are required to verify isolation.");
  ready = true;
});
afterAll(async () => {
  if (!ready) return;
  const { error } = await a.from("goals").delete().like("title", `${prefix}%`);
  if (error) throw new Error("Live test cleanup failed. Remove only goals whose title starts with this run's integration-check prefix in the development project.");
  await a.auth.signOut({ scope: "local" }); await b.auth.signOut({ scope: "local" });
});
describe("LIVE Supabase persistence and RLS (requires real external configuration)", () => {
  it("creates a goal and all five tasks atomically", async () => {
    const { data, error } = await a.rpc("create_goal_plan", { p_title: prefix, p_description: "Disposable integration test", p_deadline: today, p_tasks: tasks });
    expect(error).toBeNull(); expect(typeof data).toBe("string"); goalId = data;
    const result = await a.from("goals").select("*,tasks(*)").eq("id", goalId).single();
    expect(result.error).toBeNull(); expect(result.data?.tasks).toHaveLength(5);
    taskId = result.data!.tasks[0].id;
  });
  it("persists goal edits and task completion across independent client sessions", async () => {
    expect((await a.from("goals").update({ description: "Updated in live test" }).eq("id", goalId)).error).toBeNull();
    expect((await a.from("tasks").update({ completed: true }).eq("id", taskId)).error).toBeNull();
    const fresh = client(); await login(fresh, "A");
    const goal = await fresh.from("goals").select("description,tasks(*)").eq("id", goalId).single();
    expect(goal.error).toBeNull(); expect(goal.data?.description).toBe("Updated in live test");
    expect(goal.data?.tasks.find((task: { id: string }) => task.id === taskId)?.completed).toBe(true);
    expect((await fresh.from("tasks").update({ completed: false }).eq("id", taskId)).error).toBeNull();
    expect((await a.from("tasks").select("completed").eq("id", taskId).single()).data?.completed).toBe(false);
    await fresh.auth.signOut({ scope: "local" });
  });
  it("hides A's goals and tasks from B and blocks modifications and deletes", async () => {
    for (const [table, id] of [["goals", goalId], ["tasks", taskId]]) {
      const read = await b.from(table).select("id").eq("id", id);
      expect(read.error).toBeNull(); expect(read.data).toEqual([]);
      const update = await b.from(table).update(table === "goals" ? { title: "Stolen goal title" } : { completed: true }).eq("id", id).select("id");
      expect(update.error).toBeNull(); expect(update.data).toEqual([]);
      const remove = await b.from(table).delete().eq("id", id).select("id");
      expect(remove.error).toBeNull(); expect(remove.data).toEqual([]);
    }
    expect((await a.from("goals").select("title").eq("id", goalId).single()).data?.title).toBe(prefix);
  });
  it("blocks inserting tasks into another user's goal and changing ownership", async () => {
    expect((await b.from("tasks").insert({ ...tasks[0], goal_id: goalId, position: 9 })).error).not.toBeNull();
    const userB = await b.auth.getUser();
    expect((await a.from("goals").update({ user_id: userB.data.user!.id }).eq("id", goalId)).error).not.toBeNull();
    expect((await b.from("goals").insert({ user_id: userB.data.user!.id, title: "Forged owner field", deadline: today })).error).not.toBeNull();
    expect((await a.from("tasks").update({ goal_id: randomUUID() }).eq("id", taskId)).error).not.toBeNull();
  });
  it("denies unauthenticated reads, writes, and RPC execution", async () => {
    expect((await anonymous.from("goals").select("id")).error).not.toBeNull();
    expect((await anonymous.from("tasks").update({ completed: true }).eq("id", taskId)).error).not.toBeNull();
    expect((await anonymous.rpc("create_goal_plan", { p_title: prefix, p_description: "", p_deadline: today, p_tasks: tasks })).error).not.toBeNull();
  });
  it("rolls back the goal when a task insert violates constraints", async () => {
    const title = `${prefix} rollback`;
    const result = await a.rpc("create_goal_plan", { p_title: title, p_description: "", p_deadline: today, p_tasks: tasks.map((task, i) => i === 2 ? { ...task, title: "" } : task) });
    expect(result.error).not.toBeNull();
    const rows = await a.from("goals").select("id").eq("title", title);
    expect(rows.error).toBeNull(); expect(rows.data).toEqual([]);
  });
  it("deletes the owned goal and removes its accessible tasks", async () => {
    const result = await a.from("goals").delete().eq("id", goalId).select("id");
    expect(result.error).toBeNull(); expect(result.data).toHaveLength(1);
    expect((await a.from("goals").select("id").eq("id", goalId)).data).toEqual([]);
    expect((await a.from("tasks").select("id").eq("goal_id", goalId)).data).toEqual([]);
  });
});
