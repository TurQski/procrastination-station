import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
import { Dashboard, GoalDetail } from "./dashboard";
const fetcher = vi.fn();
const goal = { id: "goal-a", user_id: "user-a", title: "Finish the project", description: "", deadline: "2026-10-19", created_at: "", updated_at: "", tasks: [{ id: "task-a", goal_id: "goal-a", title: "Make a first pass", description: "Start small", estimated_minutes: 15, due_date: "2026-10-19", position: 0, completed: false, created_at: "" }] };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
// Controlled HTTP fixtures test UI states only; they do not verify database persistence.
describe("saved goal workspace states", () => {
  it("shows loading followed by an honest empty state", async () => {
    fetcher.mockResolvedValue(response({ goals: [] }));
    render(<Dashboard />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(await screen.findByText("Your first saved goal starts here.")).toBeInTheDocument();
  });
  it("requires sign-in for a missing or expired session", async () => {
    fetcher.mockResolvedValue(response({ error: "Sign in." }, 401));
    render(<Dashboard />);
    expect(await screen.findByRole("heading", { name: "Sign in to keep going." })).toBeInTheDocument();
  });
  it("shows retryable configuration errors rather than pretending there are no goals", async () => {
    fetcher.mockResolvedValue(response({ error: "Account services are not configured yet." }, 503));
    render(<Dashboard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not configured");
    expect(screen.queryByText("Your first saved goal starts here.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
  it("does not show a completed checkbox until the API confirms the change", async () => {
    const user = userEvent.setup();
    let confirm!: (value: Response) => void;
    fetcher.mockResolvedValueOnce(response({ goal })).mockImplementationOnce(() => new Promise<Response>((resolve) => { confirm = resolve; })).mockResolvedValueOnce(response({ goal: { ...goal, tasks: [{ ...goal.tasks[0], completed: true }] } }));
    render(<GoalDetail id="goal-a" />);
    const checkbox = await screen.findByRole("checkbox");
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked(); expect(checkbox).toBeDisabled();
    confirm(response({ task: { id: "task-a", completed: true } }));
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
  it("clears the private view and asks for sign-in if the session expires during a write", async () => {
    const user = userEvent.setup();
    fetcher.mockResolvedValueOnce(response({ goal })).mockResolvedValueOnce(response({ error: "Session expired" }, 401));
    render(<GoalDetail id="goal-a" />);
    await user.click(await screen.findByRole("checkbox"));
    expect(await screen.findByRole("heading", { name: "Sign in to keep going." })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
