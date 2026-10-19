import { body, handle, json, assertSameOrigin, ApiError } from "@/lib/server/http";
import { serverClient } from "@/lib/server/supabase";
import { emailSchema, codeSchema } from "@/lib/validation";
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
    if (!["code", "verify", "signout"].includes(action)) throw new ApiError(404, "Not found.");
    assertSameOrigin(request);
    if (action === "signout") {
      const client = await serverClient();
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new ApiError(503, "Sign out failed. Please try again.");
      return json({ ok: true });
    }
    if (action === "code") {
      const input = await body(request, emailSchema);
      const client = await serverClient();
      const { error } = await client.auth.signInWithOtp({ email: input.email, options: { shouldCreateUser: process.env.AUTH_ALLOW_SIGNUP === "true" } });
      if (error?.status === 429) throw new ApiError(429, "Email sending is rate limited. Wait before requesting another code.");
      if (error) throw new ApiError(400, "A code could not be sent. During testing, use an existing authorized account; email limits may also apply.");
      return json({ ok: true });
    }
    const input = await body(request, codeSchema);
    const client = await serverClient();
    const { data, error } = await client.auth.verifyOtp({ ...input, type: "email" });
    if (error || !data.user) throw new ApiError(error?.status === 429 ? 429 : 400, "That code is invalid or expired. Try again or request a new code.");
    return json({ user: { id: data.user.id, email: data.user.email } });
  });
}
