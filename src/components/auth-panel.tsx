"use client";
import { useId, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
export function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api(`/api/auth/${sent ? "verify" : "code"}`, { method: "POST", body: JSON.stringify(sent ? { email: email.trim(), token: token.trim() } : { email: email.trim() }) });
      if (sent) onAuthenticated(); else setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Sign in failed. Please retry."); }
    finally { setBusy(false); }
  }
  return <section className="auth-panel" aria-labelledby={`${id}-title`}>
    <p className="ticket-label">A PLACE FOR YOUR PROGRESS</p>
    <h2 id={`${id}-title`}>Sign in to keep going.</h2>
    <p>Your saved goals are private to your account. We’ll email you a sign-in code.</p>
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor={`${id}-email`}>Email address</label>
      <input id={`${id}-email`} type="email" autoComplete="email" maxLength={254} required value={email} disabled={sent || busy} onChange={(e) => setEmail(e.target.value)} />
      {sent && <><p className="small-hint" role="status">Check your inbox for the code. It expires, so use the latest one.</p><label htmlFor={`${id}-code`}>Email code</label><input id={`${id}-code`} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={token} disabled={busy} onChange={(e) => setToken(e.target.value)} /></>}
      {error && <p role="alert" className="field-error">{error}</p>}
      <button className="primary-button" disabled={busy} type="submit">{busy ? "Please wait…" : sent ? "Verify and continue" : "Send sign-in code"}</button>
      {sent && <button type="button" className="text-button" disabled={busy} onClick={() => { setSent(false); setToken(""); setError(""); }}>Change email or request a new code</button>}
    </form>
    <p className="small-hint">Testing access is limited to existing authorized accounts. New public signups aren’t open yet.</p>
  </section>;
}
