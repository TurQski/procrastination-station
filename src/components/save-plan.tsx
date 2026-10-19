"use client";
import { useState } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/planner";
import { api, RequestError } from "@/lib/api-client";
import { AuthPanel } from "./auth-panel";
export function SavePlan({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  async function save() {
    setBusy(true); setError(""); setNeedsAuth(false);
    try {
      const data = await api<{ id: string }>("/api/goals", { method: "POST", body: JSON.stringify({ goal: plan.goal, targetDate: plan.targetDate, minutes: plan.minutes, startDate: plan.tasks[0].suggestedDate }) });
      setSavedId(data.id);
      onSaved();
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) setNeedsAuth(true);
      else setError(error instanceof Error ? error.message : "Could not save your plan.");
    } finally { setBusy(false); }
  }
  if (savedId) return <div className="save-panel"><p role="status">Saved to your account.</p><Link className="primary-button" href={`/dashboard/${savedId}`}>Open saved goal <span aria-hidden="true">↗</span></Link></div>;
  return <div className="save-panel">
    {error && <p className="field-error" role="alert">{error} If the connection dropped, check your dashboard before retrying to avoid a duplicate.</p>}
    {needsAuth ? <AuthPanel onAuthenticated={() => { void save(); }} /> : <button type="button" className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? "Saving your plan…" : "Save to my goals"}</button>}
    <p className="small-hint">Sign-in required. Until saving succeeds, this preview disappears on refresh.</p>
  </div>;
}
