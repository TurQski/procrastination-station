/* eslint-disable @next/next/no-img-element -- Preserve the approved ribbon image rendering. */
"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Command,
  Sparkles,
  Zap,
} from "lucide-react";
import { StationHeader } from "./station-header";
import { Dashboard } from "./station-dashboard";
import {
  addDays,
  generatePlan,
  localDateString,
  type Plan,
} from "@/lib/planner";
import { SavePlan } from "@/components/save-plan";

export function StationHome() {
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [saved, setSaved] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const generated = result !== null;
  const plan = result?.goal || "Launch my personal website";
  function createPlan(date = targetDate, effort = minutes) {
    const today = localDateString();
    const next = generatePlan(
      { goal, targetDate: date || addDays(today, 7), minutes: effort },
      today,
    );
    if (!next.ok) {
      setError(Object.values(next.errors)[0] || "Please check your goal.");
      setNeedsUpdate(true);
      document
        .getElementById(next.errors.goal ? "goal" : "targetDate")
        ?.focus();
      return;
    }
    setResult(next.plan);
    setError("");
    setSaved(false);
    setNeedsUpdate(false);
    setGeneration((value) => value + 1);
  }
  return (
    <div className="station-site">
      <StationHeader />
      <main>
        <section className="hero" id="how-it-works">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> A LITTLE MOMENTUM GOES A LONG WAY
            </div>
            <h1>
              Big goals.
              <br />
              Small steps.
              <br />
              <span>Let&apos;s get going.</span>
            </h1>
            <p className="hero-description">
              That thing you keep putting off? Let&apos;s make it happen.
              <br className="desktop-break" /> Turn your big, overwhelming goals
              into small,
              <br className="desktop-break" /> doable steps. One little win at a
              time.
            </p>
            <form
              id="goal-form"
              className="goal-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                createPlan();
              }}
            >
              <label htmlFor="goal">What have you been meaning to do?</label>
              <div className="goal-input-wrap">
                <Sparkles size={18} />
                <input
                  id="goal"
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    setResult(null);
                    if (error) setTargetDate("");
                    setError("");
                  }}
                  required
                  maxLength={240}
                  aria-invalid={!!error && !result}
                  aria-describedby={
                    error && !result ? "homepage-goal-error" : undefined
                  }
                  placeholder="e.g. Finally launch my personal website"
                />
                <span className="input-key">
                  <Command size={11} /> K
                </span>
              </div>
              {error && !result && (
                <p
                  id="homepage-goal-error"
                  className="field-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <button className="primary-button" type="submit">
                Find my first step <ArrowRight size={17} />
              </button>
              <span className="form-note">
                <Check size={13} /> No perfect plan needed. Just a place to
                start.
              </span>
            </form>
          </div>
          <div className="hero-art">
            <div className="orb-glow" />
            <img
              className="ribbon-image"
              src="/images/ribbon.png"
              alt="Luminous blue and purple ribbons folding into an abstract orb"
            />
            <div className="orbit-tag">
              <span className="little-icon">
                <Zap size={15} />
              </span>
              Less overthinking. More doing.
            </div>
            <div className="plan-preview" aria-live="polite">
              <div className="plan-top">
                <span>
                  <Sparkles size={14} />{" "}
                  {generated ? "YOUR STARTER PLAN" : "BIG GOAL → SMALL STEPS"}
                </span>
                <span className="preview-label">
                  {generated ? (saved ? "Saved" : "Not saved") : "Preview"}
                </span>
              </div>
              <h2>{plan}</h2>
              <div className="plan-step">
                <span className="step-number">01</span>
                <div>
                  <strong>
                    {generated
                      ? result.tasks[0].title
                      : "Find 3 websites that inspire you"}
                  </strong>
                  <span>
                    {generated
                      ? result.tasks[0].description
                      : "No building yet. Just a little exploring."}
                  </span>
                </div>
                <span className="time-pill">
                  {result?.tasks[0].minutes ?? 10} min
                </span>
              </div>
              <div className="plan-step next-step">
                <span className="step-number">02</span>
                <div>
                  <strong>
                    {generated
                      ? result.tasks[1].title
                      : "Sketch out your homepage"}
                  </strong>
                </div>
                <span className="time-pill">
                  {result?.tasks[1].minutes ?? 15} min
                </span>
              </div>
              <div className="plan-bottom">
                <span>
                  <span className="status-dot" /> You don&apos;t have to do it
                  all. Just the next step.
                </span>
                {generated && (
                  <a
                    href="#generated-plan"
                    aria-label="Open your generated plan"
                  >
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="hero-footer">
          <div className="avatar-stack">
            <span>JL</span>
            <span>AK</span>
            <span>MR</span>
            <span>ST</span>
          </div>
          <span>
            For the dreamers, the overthinkers, and the{" "}
            <strong>“I&apos;ll start tomorrow”</strong> people.
          </span>
          <span className="hero-footer-end">
            Your tomorrow starts here <ChevronRight size={14} />
          </span>
        </div>
        {result && (
          <section
            id="generated-plan"
            className="integrated-plan"
            aria-labelledby="generated-plan-title"
          >
            <div className="section-intro">
              <div>
                <div className="eyebrow">YOUR NEXT SMALL STEPS</div>
                <h2 id="generated-plan-title">Your five-step plan.</h2>
                <p>
                  {result.minutes} minutes total · Aim for {result.targetDate}
                </p>
              </div>
            </div>
            <div className="plan-options">
              <div>
                <label htmlFor="targetDate">Aim to finish by</label>
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value);
                    setNeedsUpdate(true);
                  }}
                />
              </div>
              <div>
                <label htmlFor="minutes">Time for a first version</label>
                <select
                  id="minutes"
                  value={minutes}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMinutes(value);
                    createPlan(targetDate, value);
                  }}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>
            <ol className="generated-tasks">
              {result.tasks.map((task, i) => (
                <li key={task.title}>
                  <span className="step-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <small>
                      {task.minutes} min · Suggested {task.suggestedDate}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
            <p className="small-hint">
              A rule-based starting plan. Sign in and save to keep it; this
              preview disappears on refresh.
            </p>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            {needsUpdate ? (
              <div className="save-panel">
                <p className="small-hint">
                  Your settings changed. Update your plan before saving.
                </p>
                <button className="primary-button" onClick={() => createPlan()}>
                  Update my plan
                </button>
              </div>
            ) : (
              <SavePlan
                key={generation}
                plan={result}
                onSaved={() => setSaved(true)}
              />
            )}
          </section>
        )}
        <p className="sr-only" role="status">
          Preview mode: goals aren’t saved yet. Your first step starts above.
        </p>
        <section id="your-progress" className="workspace-section">
          <div className="section-intro">
            <div>
              <div className="eyebrow">A LITTLE CLEARER. A LITTLE CLOSER.</div>
              <h2>Meet your momentum.</h2>
              <p>
                A home for your goals. A clear next step. A reason to keep
                going.
              </p>
            </div>
            <span className="demo-chip">
              <span className="status-dot" /> Your workspace preview
            </span>
          </div>
          <Dashboard compact />
        </section>
        <footer className="site-footer">
          <span>Small steps. Real progress.</span>
          <span>Made for humans, not productivity machines.</span>
          <span>Procrastination Station © 2026</span>
        </footer>
      </main>
    </div>
  );
}
