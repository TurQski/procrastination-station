import { body, handle, json, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { databaseError } from "@/lib/server/goals";
import { idSchema, updateTaskSchema } from "@/lib/validation";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const id = idSchema.parse((await context.params).id);
    const input = await body(request, updateTaskSchema);
    const { client } = await requireUser();
    // RLS checks the parent goal's owner on both the old and new row.
    const { data, error } = await client.from("tasks").update(input).eq("id", id).select("id,completed").maybeSingle();
    databaseError(error);
    if (!data) throw new ApiError(404, "Task not found.");
    return json({ task: data });
  });
}
