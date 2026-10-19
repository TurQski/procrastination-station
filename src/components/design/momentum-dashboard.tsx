"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Flag,
  LayoutDashboard,
  ListTodo,
  Plus,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useGoals } from "@/components/use-goals";
import { AuthPanel } from "@/components/auth-panel";
import { SignOut } from "@/components/sign-out";
import { api, RequestError } from "@/lib/api-client";
import { progress, type Goal } from "@/lib/models";
import {
  summarizeGoals,
  shortDate,
  type TaskEntry,
  type DailyActivity,
} from "@/lib/momentum";
import { localDateString } from "@/lib/planner";
import s from "./momentum-dashboard.module.css";

export function ProgressRing({
  value,
  label,
  small = false,
}: {
  value: number;
  label: string;
  small?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const reduced = useReducedMotion();
  return (
    <div
      className={small ? s.smallRing : s.ring}
      role="img"
      aria-label={`${label}: ${value}% complete`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#9570ff" />
            <stop offset=".5" stopColor="#7a64f6" />
            <stop offset="1" stopColor="#58d8ed" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="49"
          fill="none"
          stroke="#ffffff0c"
          strokeWidth={small ? 6 : 9}
        />
        <motion.circle
          cx="60"
          cy="60"
          r="49"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={small ? 6 : 9}
          strokeLinecap="round"
          strokeDasharray="307.88"
          initial={{
            strokeDashoffset: reduced ? 307.88 * (1 - value / 100) : 307.88,
          }}
          animate={{ strokeDashoffset: 307.88 * (1 - value / 100) }}
          transition={{ duration: reduced ? 0 : 1.2 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div>
        <strong>
          {value}
          <small>%</small>
        </strong>
        {!small && <span>overall completion</span>}
      </div>
    </div>
  );
}

// Undefined means history is unavailable. An explicit [] can represent a real, tracked empty week later.
export function WeeklyActivity({ data }: { data?: DailyActivity[] }) {
  const reduced = useReducedMotion();
  return (
    <div className={s.weekly}>
      <div className={s.heading}>
        <h3>Weekly activity</h3>
        <button className={s.period} disabled>
          This week
          <ChevronDown size={12} />
        </button>
      </div>
      <div className={s.chartSummary}>
        <strong>
          {data ? data.reduce((sum, day) => sum + day.tasks, 0) : "—"}
        </strong>
        <span>
          steps forward
          <small>
            {data
              ? "Recorded task completions"
              : "Activity history not available yet"}
          </small>
        </span>
      </div>
      {data && data.length ? (
        <ChartContainer
          config={{ tasks: { label: "Tasks completed", color: "#9873ff" } }}
          className={s.barChart}
        >
          <BarChart
            accessibilityLayer
            data={data}
            barSize={25}
            margin={{ top: 12, right: 5, left: 5, bottom: 0 }}
          >
            <defs>
              <linearGradient id="momentum-bars" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#a48aff" />
                <stop offset="1" stopColor="#6340bf" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#ffffff0b"
              strokeDasharray="3 5"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="tasks"
              fill="url(#momentum-bars)"
              radius={[5, 5, 2, 2]}
              isAnimationActive={!reduced}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className={s.weeklyEmpty}>
          <TrendingUp size={23} />
          <strong>
            {data ? "A fresh week ahead." : "Your rhythm will take shape here."}
          </strong>
          <p>
            {data
              ? "No completions recorded for this week."
              : "Activity tracking will begin when completion history is available. Your saved progress is already here."}
          </p>
          <div className={s.weeklyDays} aria-hidden="true">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export function MomentumDashboard() {
  const { state, reload, expire } = useGoals<{ goals: Goal[] }>(
    "/api/goals",
    true,
  );
  if (state.status === "loading")
    return (
      <div className="state-card" role="status">
        Loading your goals…
      </div>
    );
  if (state.status === "auth")
    return <AuthPanel onAuthenticated={() => void reload()} />;
  if (state.status === "error")
    return (
      <section className="state-card">
        <p className="ticket-label">YOUR WORKSPACE</p>
        <h1>Let&apos;s try that again.</h1>
        <p role="alert">{state.message}</p>
        <button className="secondary-button" onClick={() => void reload()}>
          Try again
        </button>
      </section>
    );
  return (
    <MomentumWorkspace
      goals={state.data.goals}
      reload={reload}
      expire={expire}
    />
  );
}
function MomentumWorkspace({
  goals,
  reload,
  expire,
}: {
  goals: Goal[];
  reload: () => Promise<void>;
  expire: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const reduced = useReducedMotion();
  const today = localDateString();
  const metrics = summarizeGoals(goals, today);
  const { completedTasks: done, totalTasks: total, percent, focus } = metrics;
  const icons = [Rocket, Target, Zap];
  async function toggle(entry: TaskEntry) {
    setPending(entry.task.id);
    setError("");
    try {
      await api("/api/tasks/" + entry.task.id, {
        method: "PATCH",
        body: JSON.stringify({ completed: !entry.task.completed }),
      });
      await reload();
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) expire();
      else
        setError(
          error instanceof Error
            ? error.message
            : "Could not update the task. Please retry.",
        );
    } finally {
      setPending(null);
    }
  }
  const tabs = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Goals", icon: Target },
    { name: "Tasks", icon: ListTodo },
    { name: "Progress", icon: TrendingUp },
  ];
  const stats = [
    {
      label: "Overall completion",
      value: percent + "%",
      detail: metrics.remainingTasks + " small steps to go",
      icon: TrendingUp,
      tone: "violet",
    },
    {
      label: "Active goals",
      value: String(metrics.activeGoals).padStart(2, "0"),
      detail: metrics.completedGoals + " completed goals",
      icon: Target,
      tone: "blue",
    },
    {
      label: "Tasks completed",
      value: String(done).padStart(2, "0"),
      detail: "Across your saved goals",
      icon: Check,
      tone: "cyan",
    },
    {
      label: "Next deadline",
      value: metrics.nextDeadline
        ? shortDate(metrics.nextDeadline.deadline)
        : "All clear",
      detail: metrics.nextDeadline
        ? (metrics.nextDeadline.deadline < today ? "Overdue · " : "") +
          metrics.nextDeadline.title
        : "No upcoming deadlines",
      icon: CalendarDays,
      tone: "violet",
    },
  ];
  return (
    <MotionConfig reducedMotion="user">
      <div className={s.workspace}>
        <aside className={s.sidebar}>
          <div className={s.sidebarLogo}>
            <Target size={24} />
          </div>
          <nav aria-label="Workspace sections">
            {tabs.map(({ name, icon: Icon }) => (
              <button
                key={name}
                aria-label={name}
                title={name}
                aria-pressed={tab === name}
                className={tab === name ? s.active : ""}
                onClick={() => setTab(name)}
              >
                <Icon size={19} />
              </button>
            ))}
          </nav>
          <button aria-label="Workspace help" onClick={() => setTab("Help")}>
            <CircleHelp size={19} />
          </button>
          <span className={s.avatar} aria-label="Your personal workspace">
            ME
          </span>
        </aside>
        <div className={s.body}>
          <header className={s.topbar}>
            <div>
              My Momentum <span className={s.personal}>Personal</span>
            </div>
            <span className={s.preview}>
              <i />
              Your saved workspace
            </span>
            <div className={s.account}>
              <SignOut />
            </div>
          </header>
          <div className={s.main}>
            <div className={s.greeting}>
              <div>
                <span className={s.eyebrow}>YOUR MOMENTUM, AT A GLANCE</span>
                <h1>
                  A little progress. <span>A lot of possibility.</span>
                </h1>
                <p>Welcome back. Make room for the next small win.</p>
              </div>
              <Link className={s.primary} href="/#goal-form">
                <Plus size={16} /> New goal
              </Link>
            </div>
            <div className={s.sectionNav}>
              <div>
                {tabs.map(({ name }) => (
                  <button
                    aria-pressed={tab === name}
                    className={tab === name ? s.selectedTab : ""}
                    key={name}
                    onClick={() => setTab(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <span>
                <CalendarDays size={13} />
                {new Intl.DateTimeFormat("en-US", { month: "long" }).format(
                  new Date(),
                )}{" "}
                · Your schedule
              </span>
            </div>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            {pending && (
              <p className={s.pending} role="status">
                Saving your progress…
              </p>
            )}
            {tab === "Help" ? (
              <section className={s.panel}>
                <h2>Your space to build momentum</h2>
                <p>
                  Create a plan, sign in, and save it. Each checkbox saves to
                  your account. Open a goal to see all its steps or delete it
                  with confirmation.
                </p>
                <p>
                  Weekly history and focus-session timers are not tracked yet.
                  Estimated effort comes from your plan, not a time tracker.
                </p>
                <button
                  className={s.primary}
                  onClick={() => setTab("Overview")}
                >
                  Back to overview
                </button>
              </section>
            ) : (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={s.stats}>
                  {stats.map((stat, i) => (
                    <motion.section
                      className={s.stat}
                      key={stat.label}
                      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduced ? 0 : i * 0.06 }}
                    >
                      <div>
                        <span>{stat.label}</span>
                        <span className={s.statIcon} data-tone={stat.tone}>
                          <stat.icon size={16} />
                        </span>
                      </div>
                      <strong>{stat.value}</strong>
                      <small>{stat.detail}</small>
                    </motion.section>
                  ))}
                </div>
                <div className={s.content}>
                  <div className={s.left}>
                    {(tab === "Overview" || tab === "Progress") && (
                      <section className={s.panel + " " + s.analytics}>
                        <div className={s.heading}>
                          <div>
                            <span className={s.eyebrow}>THE BIG PICTURE</span>
                            <h2>Your progress, in perspective</h2>
                          </div>
                          <span className={s.sample}>Saved task progress</span>
                        </div>
                        <div className={s.charts}>
                          <div className={s.overall}>
                            <ProgressRing
                              value={percent}
                              label="Overall progress"
                            />
                            <div className={s.legend}>
                              <span>
                                <i />
                                {done} completed
                              </span>
                              <span>
                                <i />
                                {total - done} remaining
                              </span>
                            </div>
                          </div>
                          <WeeklyActivity />
                        </div>
                        <div className={s.insight}>
                          <Sparkles size={15} />
                          <p>
                            {total === 0
                              ? "Your first step starts with a goal."
                              : percent >= 60
                                ? "More than halfway there."
                                : "A little consistency goes a long way."}{" "}
                            <span>
                              Keep choosing the next step, not the whole
                              staircase.
                            </span>
                          </p>
                          <ArrowUpRight size={15} />
                        </div>
                      </section>
                    )}
                    {(tab === "Overview" || tab === "Goals") && (
                      <section>
                        <div className={s.heading}>
                          <h2>
                            Your goals{" "}
                            <span className={s.count}>{goals.length}</span>
                          </h2>
                          <button
                            className={s.textButton}
                            onClick={() =>
                              setTab(tab === "Goals" ? "Overview" : "Goals")
                            }
                          >
                            {tab === "Goals"
                              ? "Back to overview"
                              : "View all goals"}
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                        {goals.length ? (
                          <div className={s.goals}>
                            {goals.map((g, i) => {
                              const Icon = icons[i % icons.length];
                              const count = g.tasks.filter(
                                (task) => task.completed,
                              ).length;
                              const next = [...g.tasks]
                                .sort((a, b) => a.position - b.position)
                                .find((task) => !task.completed);
                              return (
                                <motion.article
                                  key={g.id}
                                  className={s.goal}
                                  data-tone={["violet", "blue", "cyan"][i % 3]}
                                  whileHover={reduced ? {} : { y: -3 }}
                                >
                                  <div className={s.goalTop}>
                                    <span className={s.goalIcon}>
                                      <Icon size={19} />
                                    </span>
                                    <ProgressRing
                                      small
                                      value={progress(g.tasks)}
                                      label={g.title}
                                    />
                                  </div>
                                  <span className={s.category}>
                                    Personal goal
                                  </span>
                                  <h3>
                                    <Link href={"/dashboard/" + g.id}>
                                      {g.title}
                                    </Link>
                                  </h3>
                                  <div className={s.goalCount}>
                                    <strong>{count}</strong> / {g.tasks.length}{" "}
                                    steps completed{" "}
                                    <span>{g.tasks.length - count} left</span>
                                  </div>
                                  <div className={s.nextStep}>
                                    <span>NEXT SMALL STEP</span>
                                    <p>
                                      {next?.title ||
                                        (g.tasks.length
                                          ? "All steps complete."
                                          : "No tasks in this goal.")}
                                    </p>
                                  </div>
                                  <div className={s.goalFooter}>
                                    <span>
                                      <CalendarDays size={12} />
                                      {shortDate(g.deadline)}
                                    </span>
                                    <Link
                                      href={"/dashboard/" + g.id}
                                      aria-label={"Open " + g.title}
                                    >
                                      <ArrowUpRight size={17} />
                                    </Link>
                                  </div>
                                  <span className={s.onTrack}>
                                    {g.tasks.length > 0 &&
                                    count === g.tasks.length
                                      ? "Complete"
                                      : g.deadline < today
                                        ? "Overdue"
                                        : "In progress"}
                                  </span>
                                </motion.article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={s.emptyGoals}>
                            <Target size={30} />
                            <h3>Your first saved goal starts here.</h3>
                            <p>
                              Preview a plan, then save it to keep your steps
                              and progress in one place.
                            </p>
                            <Link className={s.primary} href="/#goal-form">
                              Create your first plan
                              <ArrowRight size={15} />
                            </Link>
                          </div>
                        )}
                      </section>
                    )}
                    {(tab === "Overview" || tab === "Progress") && (
                      <section className={s.panel + " " + s.timeline}>
                        <div className={s.heading}>
                          <h2>The road ahead</h2>
                          <span className={s.sample}>
                            Upcoming task deadlines
                          </span>
                        </div>
                        {metrics.roadmap.length ? (
                          <div className={s.roadmap}>
                            {metrics.roadmap.map(({ task, goal }, i) => (
                              <div
                                className={s.milestone}
                                data-state={i === 0 ? "current" : "future"}
                                key={task.id}
                              >
                                <div className={s.marker}>
                                  {i === metrics.roadmap.length - 1 ? (
                                    <Flag size={11} />
                                  ) : (
                                    <i />
                                  )}
                                </div>
                                <small>{shortDate(task.due_date)}</small>
                                <strong>{task.title}</strong>
                                <span>{goal.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={s.formNote}>
                            {metrics.remainingTasks
                              ? "Overdue tasks are waiting in your checklist."
                              : "No upcoming steps. Make space for your next goal."}
                          </p>
                        )}
                      </section>
                    )}
                    {tab === "Tasks" && (
                      <section className={s.panel}>
                        <h2>Your next small steps</h2>
                        <p>One thing at a time is more than enough.</p>
                        <TaskChecklist
                          entries={metrics.entries}
                          pending={pending}
                          toggle={toggle}
                        />
                      </section>
                    )}
                  </div>
                  <aside className={s.right}>
                    <section className={s.focus}>
                      <div className={s.heading}>
                        <h2>
                          <Sparkles size={16} /> Today&apos;s focus
                        </h2>
                        <span className={s.liveDot} />
                      </div>
                      <div className={s.orb} aria-hidden="true" />
                      <span className={s.eyebrow}>YOUR NEXT RIGHT THING</span>
                      <h3>
                        {focus?.task.title ||
                          (total
                            ? "A little room to breathe."
                            : "Make room for a first step.")}
                      </h3>
                      <p>
                        {focus?.task.description ||
                          (total
                            ? "Your saved tasks are all complete. Enjoy the progress you have made."
                            : "Start with a goal. We will help you find a small, doable next action.")}
                      </p>
                      <div className={s.focusMeta}>
                        <span>
                          <Clock3 size={13} />
                          {focus
                            ? focus.task.estimated_minutes + " min estimated"
                            : "No pending tasks"}
                        </span>
                        {focus && <span>{focus.goal.title}</span>}
                      </div>
                      <Link
                        className={s.primary}
                        href={
                          focus ? "/dashboard/" + focus.goal.id : "/#goal-form"
                        }
                      >
                        {focus
                          ? "Let’s make a little progress"
                          : "Plan your next goal"}
                        <ArrowRight size={15} />
                      </Link>
                      <small>
                        {metrics.estimatedRemainingMinutes} min estimated
                        remaining across your tasks
                      </small>
                    </section>
                    <section className={s.panel + " " + s.wins}>
                      <div className={s.heading}>
                        <h2>Small wins</h2>
                        <span className={s.count}>
                          {done}/{total}
                        </span>
                      </div>
                      <TaskChecklist
                        entries={metrics.entries
                          .slice()
                          .sort(
                            (a, b) =>
                              Number(a.task.completed) -
                                Number(b.task.completed) ||
                              a.task.due_date.localeCompare(b.task.due_date),
                          )
                          .slice(0, 3)}
                        pending={pending}
                        toggle={toggle}
                      />
                      <div className={s.winsNote}>
                        <Sparkles size={13} />
                        {total && done === total
                          ? "All done. Take a well-earned break."
                          : "Showing up is already a win."}
                      </div>
                    </section>
                    <div className={s.quote}>
                      <span>“</span>
                      <p>
                        You don&apos;t have to see the whole staircase. Just
                        take the first step.
                      </p>
                      <small>A LITTLE REMINDER, JUST FOR YOU</small>
                    </div>
                  </aside>
                </div>
              </motion.div>
            )}
            <footer className={s.footer}>
              <span>
                <i />
                Progress, not perfection.
              </span>
              <span>Private goals · saved to your account</span>
            </footer>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
function TaskChecklist({
  entries,
  pending,
  toggle,
}: {
  entries: TaskEntry[];
  pending: string | null;
  toggle: (entry: TaskEntry) => Promise<void>;
}) {
  if (!entries.length)
    return (
      <p className={s.formNote}>
        No tasks yet. Save a plan to find your next small step.
      </p>
    );
  return (
    <div className={s.checklist}>
      {entries.map((entry) => (
        <motion.label
          layout
          className={s.task}
          data-checked={entry.task.completed}
          aria-busy={pending === entry.task.id}
          key={entry.task.id}
        >
          <input
            type="checkbox"
            checked={entry.task.completed}
            disabled={!!pending}
            onChange={() => void toggle(entry)}
          />
          <span className={s.checkBox} aria-hidden="true">
            {entry.task.completed && <Check size={12} />}
          </span>
          <span>
            <strong>{entry.task.title}</strong>
            <small>
              {entry.goal.title} · {entry.task.estimated_minutes} min estimated
            </small>
          </span>
        </motion.label>
      ))}
    </div>
  );
}
