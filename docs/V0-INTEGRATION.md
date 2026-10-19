# v0 interface integration

Updated October 19, 2026. Branch: feat/v0-dashboard-integration. Based on verified MVP commit 7118182. Feature-branch commit/push approved after review. Main merge and production deployment remain unapproved.

## Implementation increments

1. Design system and shared layout: imported the approved dark palette, gradients, responsive rules, reduced-motion handling, ribbon artwork, icons and shared StationHeader. Functional-page styling is scoped to avoid changing the homepage preview. The CSS module isolates premium dashboard styling. Existing npm/Node/Next configuration remains in use.
2. Homepage: retained the export's initial presentation and compact sample workspace. Connected its form to the original deterministic five-stage planner and SavePlan. Deadline/effort controls and authenticated saving appear after generation. Editing a deadline requires updating the plan before saving; invalid dates remain correctable. Preview and saved states are distinct. The compact workspace is an explicitly labelled marketing demonstration with no account data or database mutations.
3. My Momentum: the premium dashboard uses useGoals and the existing private APIs. Goal cards, progress rings, counts, task lists, focus recommendations and upcoming deadlines come from persisted goals/tasks. Inline task actions wait for the server and reload confirmed data. Refreshing preserves the active tab; expired sessions still clear private data.
4. Goal details and authentication: kept the existing AuthPanel and GoalDetail behavior, password handling, confirmation before deletion, server-side authorization and secure-cookie settings. Applied matching dark functional-page styling. SignOut was moved to a shared component without changing its behavior.
5. Quality: preserved the original 71 unit/component/API tests and added 13 for calculations, history honesty, zero-task presentation, dashboard task saves and homepage integration/validation. Updated public browser selectors for the approved homepage. Extended the live suite for dashboard and detail complete/incomplete persistence.

## Real-data rules

- Overall completion = completed tasks / all tasks in currently saved goals, rounded to a whole percent. Empty denominator gives 0%, never NaN.
- A completed goal has at least one task and every task completed. Zero-task goals remain active with 0% completion.
- Active/completed goal counts, completed/remaining tasks and per-goal progress are calculated from current persisted records. Deleted records are excluded; these are not lifetime totals.
- Next deadline is the earliest unfinished goal deadline; overdue records are explicitly marked. Road-ahead items use actual upcoming incomplete-task due dates.
- Focus chooses the earliest incomplete task by due date and then position. Estimated remaining work sums incomplete-task estimated_minutes; it is not measured time worked.
- Personal goal is a neutral label; the schema has no categories, profile display names, focus sessions or prediction of being on track.

## Weekly chart contract

WeeklyActivity accepts optional DailyActivity[] ({ day, tasks }). Undefined means history is unavailable. An explicit empty array means a tracked empty week in the future. No live historical data is passed today.

The original weekly container, styling, labels, gradient bar renderer, tooltip and layout remain available. The current UI renders a polished empty chart with weekday labels and explains that tracking starts when completion history is available. It draws no fake bars, totals or trends. No attempt is made to infer completion dates from due dates, goal updated_at or record creation dates.

Completion timestamps/event history, streaks, daily wins, comparisons with last week and focus timers remain deferred. There are no schema, RLS, auth-provider configuration or environment changes.

## Dependency choices

Added only six directly used packages: lucide-react, motion, recharts, clsx, tailwind-merge and tw-animate-css. Preserved the npm lockfile workflow, TypeScript checking and Node 22 requirement. Did not import unused Base UI/button/card libraries, optional analytics, the shadcn CLI package, or the export's ignoreBuildErrors setting. The unused shadcn CSS import was omitted; reference screenshots use the same omission and no visible homepage styles depend on it.

## Verification and visual evidence

- Lint, TypeScript, 84 unit/component/API tests and production build passed.
- Existing 8 desktop/mobile public browser checks passed.
- Final expanded live desktop/mobile Supabase browser workflows: 2 passed, including dashboard and detail complete/incomplete persistence. Live database regression suite: 7 passed.
- Screenshots use Edge on desktop (1280px viewport) and iPhone 13 emulation (390px viewport, 3x scale), with reduced motion. They show a real disposable test goal, not mock account statistics. Test records are cleaned up.
- Final full-page homepage comparison: desktop 0.000000% changed pixels; mobile 0.004336% changed pixels. The comparison JSON is stored with the screenshots.
- Reference screenshots come from an isolated copy of the original export. Only unused analytics and shadcn CSS imports were omitted to run with the application's dependency set; the source export remains untouched.
- Functional dashboard differences are deliberate: actual data, account-neutral greeting/avatar, sign-out, no invented categories or on-track claims, the history empty state, and actual due-date milestones. The number of cards reflects the account's real saved goals.

Local evidence is stored outside the application repository under vault_admin/procrastination-station-v0-review/. It includes desktop/mobile homepages, dashboards, goal details, empty sign-in screens and original-v0 reference screenshots.

## Safe visual capture

Normal live browser tests keep trace, screenshot and video recording off. Setting VISUAL_REVIEW_DIR explicitly enables limited screenshots taken before credentials are entered or after the form has unmounted. Never record a filled authentication form, environment values, cookies or tokens. Do not enable traces for real accounts.

## Deployment readiness

Local verification is complete and feature-branch commit/push is approved. Check hosted CI for the new commit before preview review. Main merge and production deployment remain unapproved. The existing Vercel/Supabase setup applies; no new environment variable or migration is needed. Repeat the deployed authentication/save/refresh/progress/sign-out workflow after any authorized deployment.
