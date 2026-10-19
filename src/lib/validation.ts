import { z } from "zod";
const date = z.iso.date();
export const idSchema = z.uuid();
export const emailSchema = z.object({ email: z.email().max(254).transform((value) => value.toLowerCase()) }).strict();
export const codeSchema = emailSchema.extend({ token: z.string().regex(/^\d{6,10}$/, "Enter the numeric code from your email.") });
export const createGoalSchema = z.object({
  goal: z.string().trim().min(8).max(240),
  description: z.string().trim().max(4000).default(""),
  targetDate: date,
  startDate: date,
  minutes: z.number().int().min(15).max(600),
}).strict();
export const updateGoalSchema = z.object({
  title: z.string().trim().min(8).max(240).optional(),
  description: z.string().trim().max(4000).optional(),
  deadline: date.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Supply a field to update.");
export const updateTaskSchema = z.object({ completed: z.boolean() }).strict();
export function currentPlanningDate(date: string, now = new Date()): boolean {
  // Browser and server may have different calendar dates near midnight.
  const utcToday = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const input = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(input) && Math.abs(input - utcToday) <= 86_400_000;
}
