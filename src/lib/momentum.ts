import type { Goal, Task } from "./models";
import { localDateString } from "./planner";
export type TaskEntry = { task: Task; goal: Goal };
export type DailyActivity = { day: string; tasks: number };
export function summarizeGoals(goals: Goal[], today = localDateString()) {
  const entries: TaskEntry[] = goals.flatMap((goal) =>
    goal.tasks.map((task) => ({ task, goal })),
  );
  const completedTasks = entries.filter((entry) => entry.task.completed).length;
  const remaining = entries
    .filter((entry) => !entry.task.completed)
    .sort(
      (a, b) =>
        a.task.due_date.localeCompare(b.task.due_date) ||
        a.task.position - b.task.position ||
        a.task.id.localeCompare(b.task.id),
    );
  const completedGoals = goals.filter(
    (goal) =>
      goal.tasks.length > 0 && goal.tasks.every((task) => task.completed),
  ).length;
  const active = goals.filter(
    (goal) =>
      goal.tasks.length === 0 || goal.tasks.some((task) => !task.completed),
  );
  const deadlines = [...active].sort((a, b) =>
    a.deadline.localeCompare(b.deadline),
  );
  return {
    entries,
    remaining,
    totalTasks: entries.length,
    completedTasks,
    remainingTasks: remaining.length,
    percent: entries.length
      ? Math.round((completedTasks / entries.length) * 100)
      : 0,
    completedGoals,
    activeGoals: active.length,
    nextDeadline: deadlines[0] ?? null,
    overdueGoals: active.filter((goal) => goal.deadline < today).length,
    estimatedRemainingMinutes: remaining.reduce(
      (sum, entry) => sum + entry.task.estimated_minutes,
      0,
    ),
    focus: remaining[0] ?? null,
    roadmap: remaining
      .filter((entry) => entry.task.due_date >= today)
      .slice(0, 4),
  };
}
export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}
