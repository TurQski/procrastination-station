"use client";
import { useId, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
export function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/auth/signin", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) });
      setPassword("");
      onAuthenticated();
    } catch (error) { setPassword(""); setError(error instanceof Error ? error.message : "Sign in failed. Please retry."); }
    finally { setBusy(false); }
  }
  return <section className="auth-panel" aria-labelledby={`${id}-title`}>
    <p className="ticket-label">A PLACE FOR YOUR PROGRESS</p>
    <h2 id={`${id}-title`}>Sign in to keep going.</h2>
    <p>Your saved goals are private to your account. Sign in with your email and password.</p>
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor={`${id}-email`}>Email address</label>
      <input id={`${id}-email`} type="email" autoComplete="username" maxLength={254} required value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor={`${id}-password`}>Password</label>
      <input id={`${id}-password`} type="password" autoComplete="current-password" maxLength={4096} required value={password} disabled={busy} onChange={(e) => setPassword(e.target.value)} />
      {error && <p role="alert" className="field-error">{error}</p>}
      <button className="primary-button" disabled={busy} type="submit">{busy ? "Signing in..." : "Sign in"}</button>
    </form>
    <p className="small-hint">MVP access is limited to existing confirmed accounts. Public signup is closed. Contact the project owner if you need account help.</p>
  </section>;
}
