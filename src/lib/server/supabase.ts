import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ApiError } from "./http";

// Route handlers only: they can persist refreshed cookies. No browser Supabase client.
export async function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !key.startsWith("sb_publishable_")) {
    throw new ApiError(503, "Account services are not configured yet. You can still preview a plan.");
  }
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => { for (const { name, value, options } of values) jar.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" }); },
    },
  });
}
export async function requireUser() {
  const client = await serverClient();
  const { data, error } = await client.auth.getUser();
  if (error && (error.name === "AuthRetryableFetchError" || (error.status && error.status >= 500))) throw new ApiError(503, "Sign-in services are temporarily unavailable. Please retry.");
  if (error || !data.user) throw new ApiError(401, "Your session has ended. Sign in to continue.");
  return { client, user: data.user };
}
