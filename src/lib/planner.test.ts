import { describe, expect, it } from "vitest";
import { addDays, generatePlan, localDateString } from "./planner";
const today = "2026-10-18";
const valid = { goal: "Finish my history essay", minutes: 60, targetDate: "2026-10-25" };
describe("goal planning", () => {
  it("returns deterministic stages whose durations add up and dates stay within the target", () => {
    const result = generatePlan(valid, today);
    expect(result).toEqual(generatePlan(valid, today));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected plan");
    expect(result.plan.tasks).toHaveLength(5);
    expect(result.plan.tasks.reduce((sum, task) => sum + task.minutes, 0)).toBe(60);
    expect(result.plan.tasks[0].suggestedDate).toBe(today);
    expect(result.plan.tasks.at(-1)?.suggestedDate).toBe(valid.targetDate);
    for (const task of result.plan.tasks) {
      expect(task.minutes).toBeGreaterThan(0);
      expect(task.suggestedDate >= today && task.suggestedDate <= valid.targetDate).toBe(true);
    }
  });
  it.each([15, 16, 30, 59, 60, 120, 240, 600])("preserves a %i-minute total with positive integer durations", (minutes) => {
    const result = generatePlan({ ...valid, minutes }, today);
    if (!result.ok) throw new Error("Expected plan");
    expect(result.plan.tasks.reduce((sum, task) => sum + task.minutes, 0)).toBe(minutes);
    expect(result.plan.tasks.every((task) => Number.isInteger(task.minutes) && task.minutes > 0)).toBe(true);
  });
  it.each(["", "    ", "short", "x".repeat(241)])("rejects invalid goal text", (goal) => {
    const result = generatePlan({ ...valid, goal }, today);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.goal).toBeTruthy();
  });
  it.each([NaN, Infinity, 14, 601, 20.5])("rejects invalid budget %s", (minutes) => {
    expect(generatePlan({ ...valid, minutes }, today).ok).toBe(false);
  });
  it.each(["", "tomorrow", "2026-02-30", "2026-13-01", "2026-10-17", "2027-10-19"]) ("rejects invalid, past, or too distant date %s", (targetDate) => {
    const result = generatePlan({ ...valid, targetDate }, today);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.targetDate).toBeTruthy();
  });
  it("supports a same-day goal and normalizes whitespace", () => {
    const result = generatePlan({ ...valid, goal: "  Finish   my essay  ", targetDate: today }, today);
    if (!result.ok) throw new Error("Expected plan");
    expect(result.plan.goal).toBe("Finish my essay");
    expect(result.plan.tasks.every((task) => task.suggestedDate === today)).toBe(true);
  });
  it("handles leap days and year boundaries", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(() => addDays("2026-02-30", 1)).toThrow();
  });
  it("uses the local calendar date", () => {
    expect(localDateString(new Date(2026, 9, 18, 23, 59))).toBe(today);
  });
});
