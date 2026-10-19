"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, RequestError } from "@/lib/api-client";
import { progress, type Goal } from "@/lib/models";
import { useGoals, type Remote } from "./use-goals";
import { AuthPanel } from "./auth-panel";

function Gate<T>({ state, reload }: { state: Remote<T>; reload: () => Promise<void> }) {
  if (state.status === "loading") return <div className="state-card" role="status">Loading your goals…</div>;
  if (state.status === "auth") return <AuthPanel onAuthenticated={() => void reload()} />;
  if (state.status === "error") return <div className="state-card"><h2>{state.code === 404 ? "That goal isn’t available." : "We couldn’t load this just yet."}</h2><p role="alert">{state.message}</p><button className="secondary-button" onClick={() => void reload()}>Try again</button> <Link href="/dashboard">Back to my goals</Link></div>;
  return null;
}
function Meter({ goal }: { goal: Goal }) {
  const percent = progress(goal.tasks);
  return <div className="goal-progress"><div><span>{goal.tasks.filter((task) => task.completed).length} of {goal.tasks.length} steps</span><strong>{percent}%</strong></div><progress max={100} value={percent} aria-label={`Progress for ${goal.title}`} /></div>;
}
export function Dashboard() {
  const { state, reload } = useGoals<{ goals: Goal[] }>("/api/goals");
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">YOUR NEXT SMALL STEP</p><h1>Look how far<br /><span>you can go.</span></h1><p>Saved goals. Small steps. Progress that stays with you.</p></div><Link className="primary-button" href="/#goal-form">Plan a new goal ↗</Link></div>
    <Gate state={state} reload={reload} />
    {state.status === "ready" && <div className="account-actions"><SignOut /></div>}
    {state.status === "ready" && (state.data.goals.length ? <div className="goals-grid">{state.data.goals.map((goal) => <article className="goal-card" key={goal.id}><p className="ticket-label">AIM FOR {goal.deadline}</p><h2><Link href={`/dashboard/${goal.id}`}>{goal.title}</Link></h2>{goal.description && <p>{goal.description}</p>}<Meter goal={goal} /><Link className="goal-link" href={`/dashboard/${goal.id}`}>Continue this goal <span aria-hidden="true">↗</span></Link></article>)}</div> : <div className="state-card"><span className="empty-star" aria-hidden="true">✳</span><h2>Your first saved goal starts here.</h2><p>Preview a plan, then save it to keep your steps and progress in one place.</p><Link className="secondary-button" href="/#goal-form">Create your first plan</Link></div>)}
  </>;
}
export function GoalDetail({ id }: { id: string }) {
  const router = useRouter();
  const { state, reload, expire } = useGoals<{ goal: Goal }>(`/api/goals/${id}`);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function toggle(taskId: string, completed: boolean) {
    setPending(taskId); setError("");
    try { await api(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ completed }) }); await reload(); }
    catch (error) { if (error instanceof RequestError && error.status === 401) expire(); else setError(error instanceof Error ? error.message : "Couldn’t update the task."); }
    finally { setPending(null); }
  }
  async function remove() {
    setPending("delete"); setError("");
    try { await api(`/api/goals/${id}`, { method: "DELETE" }); router.push("/dashboard"); router.refresh(); }
    catch (error) { if (error instanceof RequestError && error.status === 401) expire(); else setError(error instanceof Error ? error.message : "Couldn’t delete the goal."); setPending(null); }
  }
  return <><Link className="back-link" href="/dashboard">← All my goals</Link><Gate state={state} reload={reload} />
    {state.status === "ready" && <div className="account-actions"><SignOut /></div>}
    {state.status === "ready" && <section className="detail-card" aria-labelledby="goal-heading"><p className="ticket-label">AIM FOR {state.data.goal.deadline}</p><h1 id="goal-heading">{state.data.goal.title}</h1>{state.data.goal.description && <p>{state.data.goal.description}</p>}<Meter goal={state.data.goal} />
      {error && <p role="alert" className="field-error">{error}</p>}
      <p className="small-hint" aria-live="polite">{pending && pending !== "delete" ? "Saving your progress…" : "Each checkbox saves automatically."}</p>
      <ul className="saved-tasks">{state.data.goal.tasks.map((task) => <li key={task.id} className={task.completed ? "is-complete" : ""}><input type="checkbox" id={`task-${task.id}`} checked={task.completed} disabled={!!pending} onChange={(e) => void toggle(task.id, e.target.checked)} /><div><label htmlFor={`task-${task.id}`}>{task.title}</label><p>{task.description}</p><span className="task-meta">{task.estimated_minutes} min / Suggested {task.due_date}</span></div></li>)}</ul>
      <div className="delete-area">{confirmDelete ? <><p>Delete this goal and all its tasks? This cannot be undone.</p><button className="danger-button" disabled={!!pending} onClick={() => void remove()}>{pending === "delete" ? "Deleting…" : "Yes, delete this goal"}</button> <button className="text-button" disabled={!!pending} onClick={() => setConfirmDelete(false)}>Keep goal</button></> : <button className="text-button" disabled={!!pending} onClick={() => setConfirmDelete(true)}>Delete goal</button>}</div>
    </section>}
  </>;
}
export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true); setError("");
    try { await api("/api/auth/signout", { method: "POST" }); router.replace("/"); router.refresh(); }
    catch { setError("Couldn’t sign out. Please retry."); setBusy(false); }
  }
  return <div><button className="text-button" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p className="field-error" role="alert">{error}</p>}</div>;
}
