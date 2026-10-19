"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Flame,
  LayoutDashboard,
  ListTodo,
  Plus,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const initialGoals = [
  {
    title: "Launch my personal website",
    category: "Personal project",
    percent: 65,
    next: "Design the homepage layout",
    date: "Oct 30",
    icon: Rocket,
    tone: "purple",
  },
  {
    title: "Read 12 books this year",
    category: "Personal growth",
    percent: 42,
    next: "Read 10 pages of Atomic Habits",
    date: "Dec 31",
    icon: BookOpen,
    tone: "blue",
  },
  {
    title: "Build a consistent workout routine",
    category: "Health & wellbeing",
    percent: 80,
    next: "A 20-minute morning workout",
    date: "Oct 25",
    icon: Zap,
    tone: "cyan",
  },
];
const tasks = [
  {
    title: "Find 3 websites that inspire you",
    goal: "Personal website",
    time: "10 min",
  },
  {
    title: "Read 10 pages of Atomic Habits",
    goal: "Read 12 books",
    time: "15 min",
  },
  { title: "Plan tomorrow’s workout", goal: "Workout routine", time: "5 min" },
];
const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Dashboard({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState("Overview");
  const [checked, setChecked] = useState<number[]>([0]);
  const [period, setPeriod] = useState("This week");
  const [goals, setGoals] = useState(initialGoals);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState(false);
  const completed = 23 + checked.length;
  return (
    <div className={cn("dashboard", !compact && "dashboard-full")}>
      <aside className="dashboard-sidebar">
        <span className="sidebar-symbol">
          <LayersMark />
        </span>
        <div className="sidebar-navigation">
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Goals", icon: Target },
            { name: "Tasks", icon: ListTodo },
            { name: "Progress", icon: TrendingUp },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              title={name}
              onClick={() => setTab(name)}
              className={cn(tab === name && "active")}
            >
              <Icon size={19} />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <a
            href="#workspace-help"
            aria-label="Workspace help"
            onClick={() => setTab("Help")}
          >
            <CircleHelp size={19} />
          </a>
          <span className="user-avatar">JD</span>
        </div>
      </aside>
      <div className="dashboard-body">
        <header className="dashboard-header">
          <div className="workspace-name">
            My workspace <ChevronDown size={13} />
            <span>Personal</span>
          </div>
          <div className="dashboard-header-right">
            <span className="streak">
              <Flame size={14} /> 5-day streak
            </span>
            <span className="small-avatar">JD</span>
          </div>
        </header>
        <div className="dashboard-main">
          <div className="dashboard-greeting">
            <div>
              <div className="dashboard-overline">
                YOUR SPACE TO MAKE THINGS HAPPEN
              </div>
              <h2>
                A little progress, every day<span className="brand-dot">.</span>
              </h2>
              <p>
                You don&apos;t need to do everything today. Just the next right
                thing.
              </p>
            </div>
            <button
              className="primary-button small"
              onClick={() => setAdding(true)}
            >
              <Plus size={15} /> New goal
            </button>
          </div>
          {adding && (
            <form
              className="new-goal-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (title.trim()) {
                  setGoals([
                    ...goals,
                    {
                      title: title.trim(),
                      category: "Personal goal",
                      percent: 0,
                      next: "Define your first small step",
                      date: "No deadline",
                      icon: Target,
                      tone: "purple",
                    },
                  ]);
                  setTitle("");
                  setAdding(false);
                  setTab("Goals");
                }
              }}
            >
              <label htmlFor="new-goal">Give your next goal a name</label>
              <div>
                <input
                  id="new-goal"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="What would you like to accomplish?"
                />
                <button className="primary-button small" type="submit">
                  Add goal
                </button>
                <button
                  type="button"
                  aria-label="Close new goal form"
                  onClick={() => setAdding(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <p>Interactive preview · changes last until you refresh.</p>
            </form>
          )}
          {tab === "Help" ? (
            <div id="workspace-help" className="help-panel">
              <h3>A little help getting started</h3>
              <p>
                Create a goal, choose a small action, and check it off when you
                finish. Use the sidebar to explore your goals, tasks, and weekly
                progress.
              </p>
              <p>
                This is an interactive design preview with sample data. Changes
                are not saved.
              </p>
              <button
                className="text-button"
                onClick={() => setTab("Overview")}
              >
                Back to overview <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                {[
                  {
                    label: "Goals in progress",
                    value: String(goals.length).padStart(2, "0"),
                    icon: Target,
                    detail: "One step closer",
                    tone: "purple",
                  },
                  {
                    label: "Tasks completed",
                    value: String(completed),
                    icon: CheckCheck,
                    detail: "+8 from last week",
                    tone: "blue",
                  },
                  {
                    label: "Completion rate",
                    value: `${Math.round((completed / 34) * 100)}%`,
                    icon: TrendingUp,
                    detail: "Look at you go",
                    tone: "cyan",
                  },
                  {
                    label: "Upcoming deadlines",
                    value: "02",
                    icon: CalendarDays,
                    detail: "In the next 7 days",
                    tone: "purple",
                  },
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-label">
                      <span>{s.label}</span>
                      <s.icon size={15} />
                    </div>
                    <div className="stat-bottom">
                      <strong>{s.value}</strong>
                      {s.label === "Completion rate" && (
                        <span
                          className="completion-ring"
                          aria-hidden="true"
                          style={{
                            background: `conic-gradient(var(--cyan) ${Math.round((completed / 34) * 100)}%, #ffffff12 0)`,
                          }}
                        />
                      )}
                      <span className={s.tone}>
                        {s.detail.startsWith("+") && <TrendingUp size={11} />}{" "}
                        {s.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dashboard-columns">
                <div className="dashboard-left">
                  {(tab === "Overview" || tab === "Progress") && (
                    <section className="panel weekly-panel">
                      <div className="panel-heading">
                        <h3>Weekly progress</h3>
                        <button
                          className="period-button"
                          onClick={() =>
                            setPeriod(
                              period === "This week"
                                ? "Last week"
                                : "This week",
                            )
                          }
                        >
                          {period}
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <div className="chart-caption">
                        <strong>
                          {period === "This week" ? completed : 16}
                        </strong>
                        <span>small steps, big difference</span>
                        <span className="chart-legend">
                          <i /> Tasks completed
                        </span>
                      </div>
                      <ChartContainer
                        config={{
                          tasks: {
                            label: "Tasks completed",
                            color: "var(--chart-1)",
                          },
                        }}
                        className="h-[130px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={week.map((day, i) => ({
                            day,
                            tasks: (period === "This week"
                              ? [3, 5, 4, 7, 2, 2, 1]
                              : [2, 3, 2, 4, 2, 2, 1])[i],
                          }))}
                          barSize={27}
                          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="barGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="var(--chart-1)" />
                              <stop
                                offset="100%"
                                stopColor="var(--chart-2)"
                                stopOpacity={0.32}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 5"
                          />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={9}
                            fontSize={10}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="tasks"
                            fill="url(#barGradient)"
                            radius={[5, 5, 0, 0]}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ChartContainer>
                    </section>
                  )}
                  {(tab === "Overview" || tab === "Goals") && (
                    <section className="goals-section">
                      <div className="panel-heading">
                        <h3>
                          Your goals{" "}
                          <span className="count-tag">{goals.length}</span>
                        </h3>
                        {tab === "Overview" && (
                          <button
                            className="text-button"
                            onClick={() => setTab("Goals")}
                          >
                            View all <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>
                      <div className="goal-cards">
                        {goals.map((g) => (
                          <article className="goal-card" key={g.title}>
                            <div className="goal-card-top">
                              <span className={cn("goal-icon", g.tone)}>
                                <g.icon size={16} />
                              </span>
                              <span>{g.category}</span>
                            </div>
                            <h4>{g.title}</h4>
                            <div className="progress-label">
                              <span>Your progress</span>
                              <strong>{g.percent}%</strong>
                            </div>
                            <div
                              className="progress-track"
                              role="progressbar"
                              aria-label={`${g.title} progress`}
                              aria-valuenow={g.percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <span
                                className={g.tone}
                                style={{ width: `${g.percent}%` }}
                              />
                            </div>
                            <p>
                              <span>Next step</span>
                              {g.next}
                            </p>
                            <div className="goal-deadline">
                              <CalendarDays size={11} />
                              {g.date}
                              <span className={g.tone}>On track</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                  {tab === "Tasks" && (
                    <section className="panel task-expanded">
                      <h3>Your next small steps</h3>
                      <p>Start with one. You can always do more.</p>
                      <TaskList checked={checked} setChecked={setChecked} />
                    </section>
                  )}
                </div>
                <div className="dashboard-right">
                  <section className="focus-panel">
                    <div className="panel-heading">
                      <h3>
                        <Sparkles size={15} /> Today&apos;s focus
                      </h3>
                      <span className="focus-dot" />
                    </div>
                    <span className="focus-kicker">
                      ONE SMALL STEP IS ENOUGH
                    </span>
                    <h4>
                      {focus
                        ? "You’ve got this. One thing at a time."
                        : "Design your homepage layout"}
                    </h4>
                    <p>
                      {focus
                        ? "Put distractions aside and give this one small step your attention."
                        : "Just a rough sketch. It doesn’t have to be perfect to be a start."}
                    </p>
                    <div className="focus-meta">
                      <span>
                        <Clock3 size={12} /> 25 min
                      </span>
                      <span>Personal website</span>
                    </div>
                    <button
                      className="focus-button"
                      onClick={() => setFocus(!focus)}
                    >
                      {focus ? "Finish focus session" : "Let’s do this"}{" "}
                      {focus ? <Check size={14} /> : <ArrowRight size={14} />}
                    </button>
                  </section>
                  <section className="panel tasks-panel">
                    <div className="panel-heading">
                      <h3>Small wins today</h3>
                      <span>
                        {checked.length}/{tasks.length}
                      </span>
                    </div>
                    <TaskList checked={checked} setChecked={setChecked} />
                    <div className="wins-footer">
                      <Sparkles size={12} />
                      {checked.length === tasks.length
                        ? "All done. Take a well-earned break!"
                        : "Every checkmark counts. You’re doing great."}
                    </div>
                  </section>
                </div>
              </div>
              <div className="dashboard-bottom">
                <span>
                  <span className="status-dot" /> Progress, not perfection.
                </span>
                <span>Interactive preview · sample workspace</span>
                <span>
                  You&apos;re further along than yesterday{" "}
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function LayersMark() {
  return <Target size={23} />;
}
function TaskList({
  checked,
  setChecked,
}: {
  checked: number[];
  setChecked: (v: number[]) => void;
}) {
  return (
    <div className="task-list">
      {tasks.map((t, i) => (
        <label
          className={cn("task-row", checked.includes(i) && "is-checked")}
          key={t.title}
        >
          <input
            type="checkbox"
            checked={checked.includes(i)}
            onChange={() =>
              setChecked(
                checked.includes(i)
                  ? checked.filter((x) => x !== i)
                  : [...checked, i],
              )
            }
          />
          <span className="task-checkbox">
            {checked.includes(i) && <Check size={11} />}
          </span>
          <span className="task-text">
            <strong>{t.title}</strong>
            <span>
              {t.goal}
              <i /> {t.time}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
