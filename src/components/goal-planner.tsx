"use client";

import { SavePlan } from "./save-plan";
import { useRef, useState, type FormEvent } from "react";
import { addDays, generatePlan, localDateString, type FieldErrors, type Plan } from "@/lib/planner";

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function GoalPlanner() {
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [unexpectedError, setUnexpectedError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnexpectedError("");
    try {
      const today = localDateString();
      const result = generatePlan({ goal, targetDate: targetDate || addDays(today, 7), minutes }, today);
      if (!result.ok) {
        setErrors(result.errors);
        setPlan(null);
        const field = Object.keys(result.errors)[0];
        document.getElementById(field)?.focus();
        return;
      }
      setErrors({});
      setPlan(result.plan);
      setSaved(false);
      setGeneration((value) => value + 1);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setPlan(null);
      setUnexpectedError("We couldn’t create your preview. Please try again.");
    }
  }
  function invalidatePreview() { setPlan(null); setErrors({}); setUnexpectedError(""); }

  return (
    <div className="planner-column min-w-0">
      <section className="planner-card" aria-labelledby="planner-title">
        <div className="card-topline"><span className="ticket-label">YOUR DEPARTURE POINT</span><span aria-hidden="true">↗</span></div>
        <h2 id="planner-title">What’s on your mind?</h2>
        <p className="card-intro">Let’s turn “I should” into “I can start here.”</p>
        <form className="scroll-mt-8" id="goal-form" onSubmit={submit} noValidate>
          <label htmlFor="goal">I want to…</label>
          <textarea id="goal" name="goal" value={goal} maxLength={240} rows={3} placeholder="e.g. Finish the first draft of my history essay" aria-invalid={!!errors.goal} aria-describedby={`goal-hint${errors.goal ? " goal-error" : ""}`} onChange={(e) => { setGoal(e.target.value); invalidatePreview(); }} />
          <div id="goal-hint" className="field-hint"><span>One goal. Any size. Start there.</span><span>{goal.length}/240</span></div>
          {errors.goal && <p id="goal-error" className="field-error" role="alert">{errors.goal}</p>}
          <div className="form-row">
            <div><label htmlFor="targetDate">Aim to finish by <span className="optional">(optional)</span></label><input id="targetDate" name="targetDate" type="date" value={targetDate} aria-invalid={!!errors.targetDate} aria-describedby={errors.targetDate ? "date-hint date-error" : "date-hint"} onChange={(e) => { setTargetDate(e.target.value); invalidatePreview(); }} /><p className="small-hint" id="date-hint">Blank? We’ll use one week.</p></div>
            <div><label htmlFor="minutes">Time for a first version</label><select id="minutes" name="minutes" value={minutes} aria-invalid={!!errors.minutes} aria-describedby={errors.minutes ? "time-hint minutes-error" : "time-hint"} onChange={(e) => { setMinutes(Number(e.target.value)); invalidatePreview(); }}><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={240}>4 hours</option></select><p id="time-hint" className="small-hint">Total effort across all steps.</p></div>
          </div>
          {errors.targetDate && <p id="date-error" className="field-error" role="alert">{errors.targetDate}</p>}
          {errors.minutes && <p id="minutes-error" className="field-error" role="alert">{errors.minutes}</p>}
          {unexpectedError && <p className="field-error" role="alert">{unexpectedError}</p>}
          <button className="primary-button" type="submit">{plan ? "Regenerate my preview" : "Find my first step"}<span aria-hidden="true">↗</span></button>
          <p className="form-disclosure">A rule-based starting plan, not AI advice. Adjust estimates to fit your goal.</p>
        </form>
        <div className="preview-notice"><span aria-hidden="true">◌</span><p><strong>Preview mode</strong> — goals aren’t saved yet. Preview freely; sign in and save to keep your plan.</p></div>
      </section>
      {plan ? <section className="plan-result" aria-labelledby="plan-title" ref={resultRef} tabIndex={-1}>
        <div className="result-heading"><span className="ticket-label">YOUR STARTING PLAN</span><span className="unsaved-badge">{saved ? "Saved" : "Not saved"}</span></div>
        <h2 id="plan-title">{plan.goal}</h2>
        <p className="plan-meta">5 small steps · {plan.minutes} minutes total · Aim for {displayDate(plan.targetDate)}</p>
        <ol className="task-list">{plan.tasks.map((task, index) => <li key={task.title}><span className="task-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{task.title}</h3><p>{task.description}</p><span className="task-meta">{task.minutes} min <span aria-hidden="true">/</span> Suggested {displayDate(task.suggestedDate)}</span></div></li>)}</ol>
        <p className="result-note">This is a general framework. If a step needs more time, reduce the scope or increase your time budget.</p>
        <SavePlan key={generation} plan={plan} onSaved={() => setSaved(true)} />
      </section> : <div className="empty-preview"><span aria-hidden="true">✳</span><p>No perfect plan required.<br /><strong>Your first step starts above.</strong></p></div>}
    </div>
  );
}
