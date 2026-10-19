import { body, handle, json, assertSameOrigin, ApiError } from "@/lib/server/http";
import { serverClient } from "@/lib/server/supabase";
import { passwordSchema } from "@/lib/validation";
type Context = { params: Promise<{ action: string }> };
export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    if ((await context.params).action !== "session") throw new ApiError(404, "Not found.");
    const client = await serverClient();
    const { data, error } = await client.auth.getUser();
    if (error && (error.name === "AuthRetryableFetchError" || (error.status && error.status >= 500))) throw new ApiError(503, "Sign-in services are temporarily unavailable.");
    return json({ user: !error && data.user ? { id: data.user.id, email: data.user.email } : null });
  });
}
export async function POST(request: Request, context: Context) {
  return handle(async () => {
    const { action } = await context.params;
    if (!["signin", "signout"].includes(action)) throw new ApiError(404, "Not found.");
    assertSameOrigin(request);
    if (action === "signout") {
      const client = await serverClient();
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new ApiError(503, "Sign out failed. Please try again.");
      return json({ ok: true });
    }
    const input = await body(request, passwordSchema);
    const client = await serverClient();
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error?.status === 429) throw new ApiError(429, "Too many sign-in attempts. Wait before trying again.");
    if (error && (error.name === "AuthRetryableFetchError" || (error.status && error.status >= 500))) throw new ApiError(503, "Sign-in services are temporarily unavailable. Please retry.");
    if (error || !data.user) throw new ApiError(401, "Email or password is incorrect, or the account is not confirmed.");
    return json({ user: { id: data.user.id, email: data.user.email } });
  });
}
