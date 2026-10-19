import "server-only";
import { z } from "zod";
import { NextResponse } from "next/server";
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
}
export async function handle(action: () => Promise<Response>) {
  try { return await action(); }
  catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError) return json({ error: error.issues[0]?.message || "Invalid request." }, 400);
    // Do not send provider errors, query text, email addresses or tokens to clients/logs.
    return json({ error: "The request could not be completed. Please try again." }, 503);
  }
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next may normalize an internal URL to localhost while the browser uses 127.0.0.1.
  // The Host header is browser-controlled routing metadata, unlike forwarded-host.
  // Explicit APP_ORIGIN remains authoritative for configured deployments.
  const host = request.headers.get("host");
  const expected = process.env.APP_ORIGIN
    ? new URL(process.env.APP_ORIGIN).origin
    : host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "This request must come from the application.");
  }
}
export async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  assertSameOrigin(request);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Send JSON data.");
  // Bound the stream, not just the untrusted Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Request body required.");
  let text = ""; let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) { await reader.cancel(); throw new ApiError(413, "Request is too large."); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new ApiError(400, "Invalid JSON."); }
  return schema.parse(value);
}
