export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store", headers: { ...options.headers, ...(options.body ? { "Content-Type": "application/json" } : {}) } });
  } catch { throw new RequestError(0, "Couldn’t connect. Check your connection and try again."); }
  let data;
  try { data = await response.json(); } catch { throw new RequestError(response.status, "An unexpected response was received. Please retry."); }
  if (!response.ok) throw new RequestError(response.status, data.error || "The request failed. Please retry.");
  return data as T;
}
