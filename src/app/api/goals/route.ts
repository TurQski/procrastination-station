import { body, handle, json, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { createGoalSchema, currentPlanningDate } from "@/lib/validation";
import { generatePlan } from "@/lib/planner";
import { databaseError, goalSelection } from "@/lib/server/goals";
export async function GET() {
  return handle(async () => {
    const { client, user } = await requireUser();
    const { data, error } = await client.from("goals").select(goalSelection).eq("user_id", user.id).order("created_at", { ascending: false });
    databaseError(error);
    return json({ goals: data ?? [] });
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    const input = await body(request, createGoalSchema);
    const { client } = await requireUser();
    if (!currentPlanningDate(input.startDate)) throw new ApiError(400, "This preview is out of date. Generate a new plan before saving.");
    const result = generatePlan(input, input.startDate);
    if (!result.ok) throw new ApiError(400, Object.values(result.errors)[0] || "Invalid plan.");
    const { data, error } = await client.rpc("create_goal_plan", {
      p_title: result.plan.goal, p_description: input.description, p_deadline: result.plan.targetDate,
      p_tasks: result.plan.tasks.map((task) => ({ title: task.title, description: task.description, estimated_minutes: task.minutes, due_date: task.suggestedDate })),
    });
    databaseError(error);
    if (!data) throw new ApiError(503, "The goal could not be saved.");
    return json({ id: data }, 201);
  });
}
