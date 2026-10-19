import { describe, expect, it } from "vitest";
import { createGoalSchema, updateGoalSchema, updateTaskSchema, currentPlanningDate, passwordSchema } from "./validation";
import { progress } from "./models";
const input = { goal: "Finish my essay", minutes: 60, targetDate: "2026-10-25", startDate: "2026-10-18" };
describe("server request validation", () => {
  it("accepts a plan request but rejects caller-supplied ownership and task payloads", () => {
    expect(createGoalSchema.safeParse(input).success).toBe(true);
    for (const extra of [{ user_id: "another-user" }, { tasks: [] }, { id: "forged" }]) expect(createGoalSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
  it("rejects malformed dates and invalid effort", () => {
    expect(createGoalSchema.safeParse({ ...input, targetDate: "2026-02-30" }).success).toBe(false);
    expect(createGoalSchema.safeParse({ ...input, minutes: "60" }).success).toBe(false);
  });
  it("limits task mutation to a real boolean", () => {
    expect(updateTaskSchema.safeParse({ completed: true }).success).toBe(true);
    for (const value of [{ completed: "false" }, { completed: false, goal_id: "forged" }, {}]) expect(updateTaskSchema.safeParse(value).success).toBe(false);
  });
  it("restricts goal updates to editable fields", () => {
    expect(updateGoalSchema.safeParse({ description: "A short note" }).success).toBe(true);
    for (const value of [{}, { user_id: "forged" }, { created_at: "now" }, { title: "a" }]) expect(updateGoalSchema.safeParse(value).success).toBe(false);
  });
  it("allows timezone differences but rejects stale or future planning dates", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    for (const day of ["2026-10-17", "2026-10-18", "2026-10-19"]) expect(currentPlanningDate(day, now)).toBe(true);
    for (const day of ["2026-10-16", "2026-10-20", "invalid"]) expect(currentPlanningDate(day, now)).toBe(false);
  });
  it("validates passwords without trimming them", () => {
    expect(passwordSchema.safeParse({ email: "person@example.com", password: " secret " }).success).toBe(true);
    expect(passwordSchema.safeParse({ email: "person@example.com", password: "" }).success).toBe(false);
  });
});
describe("persisted task progress", () => {
  it("handles empty, partial, and completed goals", () => {
    expect(progress([])).toBe(0);
    expect(progress([{ completed: true }, { completed: false }, { completed: false }])).toBe(33);
    expect(progress([{ completed: true }])).toBe(100);
  });
});
