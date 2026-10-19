import { describe, it, expect } from "vitest";
import type { Goal, Task } from "./models";
import { summarizeGoals } from "./momentum";
const task = (
  id: string,
  completed = false,
  minutes = 10,
  due = "2026-10-21",
  position = 0,
): Task => ({
  id,
  goal_id: "goal",
  title: id,
  description: "",
  estimated_minutes: minutes,
  due_date: due,
  position,
  completed,
  created_at: "",
});
const goal = (id: string, tasks: Task[], deadline = "2026-10-25"): Goal => ({
  id,
  user_id: "a",
  title: id,
  description: "",
  deadline,
  created_at: "",
  updated_at: "",
  tasks,
});
describe("real momentum calculations", () => {
  it("handles a new account without NaN, fictional progress or a made-up deadline", () => {
    const m = summarizeGoals([], "2026-10-19");
    expect(m).toMatchObject({
      percent: 0,
      activeGoals: 0,
      completedGoals: 0,
      totalTasks: 0,
      completedTasks: 0,
      remainingTasks: 0,
      estimatedRemainingMinutes: 0,
      nextDeadline: null,
      focus: null,
    });
    expect(m.roadmap).toEqual([]);
  });
  it("treats a zero-task goal as active with zero progress, never complete", () => {
    const m = summarizeGoals([goal("empty", [])], "2026-10-19");
    expect(m).toMatchObject({
      percent: 0,
      activeGoals: 1,
      completedGoals: 0,
      focus: null,
    });
    expect(m.nextDeadline?.id).toBe("empty");
  });
  it("weights aggregate completion by task count and totals only remaining estimates", () => {
    const m = summarizeGoals(
      [
        goal("done", [task("a", true)]),
        goal("active", [
          task("b", true),
          task("c", false, 25),
          task("d", false, 15),
        ]),
      ],
      "2026-10-19",
    );
    expect(m).toMatchObject({
      percent: 50,
      completedTasks: 2,
      totalTasks: 4,
      activeGoals: 1,
      completedGoals: 1,
      remainingTasks: 2,
      estimatedRemainingMinutes: 40,
    });
  });
  it("chooses incomplete work by due date then position, including overdue work", () => {
    const g = goal("work", [
      task("later", false, 10, "2026-10-22"),
      task("overdue", false, 10, "2026-10-18"),
      task("first", false, 10, "2026-10-21", 0),
      task("second", false, 10, "2026-10-21", 1),
      task("completed", true, 10, "2026-10-17"),
    ]);
    const original = g.tasks.map((t) => t.id);
    const m = summarizeGoals([g], "2026-10-19");
    expect(m.focus?.task.id).toBe("overdue");
    expect(m.roadmap.map((e) => e.task.id)).toEqual([
      "first",
      "second",
      "later",
    ]);
    expect(g.tasks.map((t) => t.id)).toEqual(original);
  });
  it("uses the earliest unfinished deadline, counts overdue goals, and omits finished deadlines", () => {
    const m = summarizeGoals(
      [
        goal("finished", [task("done", true)], "2026-10-15"),
        goal("late", [task("pending")], "2026-10-18"),
        goal("future", [task("next")], "2026-10-25"),
      ],
      "2026-10-19",
    );
    expect(m.nextDeadline?.id).toBe("late");
    expect(m.overdueGoals).toBe(1);
  });
  it("handles all completed goals without recommending already-completed work", () => {
    const m = summarizeGoals([goal("done", [task("one", true)])], "2026-10-19");
    expect(m).toMatchObject({
      percent: 100,
      completedGoals: 1,
      activeGoals: 0,
      focus: null,
      nextDeadline: null,
      estimatedRemainingMinutes: 0,
    });
    expect(m.roadmap).toEqual([]);
  });
});
