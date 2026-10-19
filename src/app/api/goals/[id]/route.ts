import { body, handle, json, assertSameOrigin, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { databaseError, readGoal } from "@/lib/server/goals";
import { idSchema, updateGoalSchema } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    const id = idSchema.parse((await context.params).id);
    const { client, user } = await requireUser();
    return json({ goal: await readGoal(client, user.id, id) });
  });
}
export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const id = idSchema.parse((await context.params).id);
    const input = await body(request, updateGoalSchema);
    const { client, user } = await requireUser();
    const { data, error } = await client.from("goals").update(input).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    databaseError(error);
    if (!data) throw new ApiError(404, "Goal not found.");
    return json({ goal: await readGoal(client, user.id, id) });
  });
}
export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await context.params).id);
    const { client, user } = await requireUser();
    const { data, error } = await client.from("goals").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    databaseError(error);
    if (!data) throw new ApiError(404, "Goal not found.");
    return json({ ok: true });
  });
}
