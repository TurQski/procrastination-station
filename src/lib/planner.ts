export type GoalInput = { goal: string; targetDate: string; minutes: number };
export type FieldErrors = Partial<Record<keyof GoalInput, string>>;
export type PlanTask = { title: string; description: string; minutes: number; suggestedDate: string };
export type Plan = { goal: string; targetDate: string; minutes: number; tasks: PlanTask[] };
export type PlanResult = { ok: true; plan: Plan } | { ok: false; errors: FieldErrors };
const DAY = 86_400_000;

export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}
export function addDays(value: string, days: number): string {
  const time = parseDate(value);
  if (time === null) throw new Error("Invalid calendar date");
  return new Date(time + days * DAY).toISOString().slice(0, 10);
}

// A fixed planning framework, not AI or researched goal-specific advice.
// Pure and storage-free; no goal is saved by this preview service.
export function generatePlan(input: GoalInput, today = localDateString()): PlanResult {
  const errors: FieldErrors = {};
  const goal = typeof input.goal === "string" ? input.goal.trim().replace(/\s+/g, " ") : "";
  if (goal.length < 8) errors.goal = "Give your goal a little more detail (at least 8 characters).";
  if (goal.length > 240) errors.goal = "Keep your goal to 240 characters or fewer.";
  if (!Number.isInteger(input.minutes) || input.minutes < 15 || input.minutes > 600) errors.minutes = "Choose a time budget between 15 and 600 minutes.";
  const start = parseDate(today);
  if (start === null) throw new Error("Invalid planning date");
  const target = parseDate(input.targetDate);
  if (target === null) errors.targetDate = "Choose a valid target date.";
  else if (target < start) errors.targetDate = "Your target date must be today or later.";
  else if (target > start + 365 * DAY) errors.targetDate = "Choose a date within the next year for this first plan.";
  if (Object.keys(errors).length) return { ok: false, errors };
  const templates = [
    ["Define your finish line", "Write one sentence describing what done looks like. Keep the first version small."],
    ["Gather the essentials", "List what you need and remove one obstacle that could slow you down."],
    ["Make a first pass", "Work on the smallest useful version. Aim for something tangible, not perfect."],
    ["Review and improve", "Compare your first pass with your finish line. Fix the most important gap."],
    ["Wrap up and choose what’s next", "Check your result, put it somewhere useful, and note any follow-up."],
  ];
  const weights = [0.1, 0.15, 0.45, 0.2];
  const durations = weights.map((weight) => Math.max(1, Math.floor(input.minutes * weight)));
  durations.push(input.minutes - durations.reduce((sum, value) => sum + value, 0));
  const days = Math.round((target! - start) / DAY);
  return { ok: true, plan: { goal, targetDate: input.targetDate, minutes: input.minutes, tasks: templates.map(([title, description], index) => ({ title, description, minutes: durations[index], suggestedDate: addDays(today, Math.round(days * index / 4)) })) } };
}
