import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./http";
import type { Goal } from "@/lib/models";
export const goalSelection = "id,user_id,title,description,deadline,created_at,updated_at,tasks(id,goal_id,title,description,estimated_minutes,due_date,position,completed,created_at)";
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new ApiError(403, "You don’t have permission to make that change.");
  if (error.code === "23514" || error.code === "22023" || error.code === "22007") throw new ApiError(400, "The plan is invalid. Generate a fresh preview and try again.");
  throw new ApiError(503, "Your goals could not be loaded or saved. Please retry.");
}
export async function readGoal(client: SupabaseClient, userId: string, id: string): Promise<Goal> {
  const { data, error } = await client.from("goals").select(goalSelection).eq("user_id", userId).eq("id", id).maybeSingle();
  databaseError(error);
  if (!data) throw new ApiError(404, "Goal not found.");
  const goal = data as Goal;
  goal.tasks.sort((a, b) => a.position - b.position);
  return goal;
}
