import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavePlan } from "./save-plan";
import { generatePlan } from "@/lib/planner";
const result = generatePlan({ goal: "Finish my project", targetDate: "2026-10-19", minutes: 60 }, "2026-10-18");
if (!result.ok) throw new Error("Invalid test plan");
const plan = result.plan;
const fetcher = vi.fn();
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
describe("saving a plan UI contract", () => {
  it("shows success only after the server returns a saved ID", async () => {
    const user = userEvent.setup(); const onSaved = vi.fn();
    fetcher.mockResolvedValue(new Response(JSON.stringify({ id: "saved-goal" }), { status: 201 }));
    render(<SavePlan plan={plan} onSaved={onSaved} />);
    await user.click(screen.getByRole("button", { name: "Save to my goals" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Saved to your account");
    expect(onSaved).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /Open saved goal/ })).toHaveAttribute("href", "/dashboard/saved-goal");
  });
  it("preserves the preview and offers sign-in on 401 without reporting success", async () => {
    const user = userEvent.setup(); const onSaved = vi.fn();
    fetcher.mockResolvedValue(new Response(JSON.stringify({ error: "Sign in" }), { status: 401 }));
    render(<SavePlan plan={plan} onSaved={onSaved} />);
    await user.click(screen.getByRole("button", { name: "Save to my goals" }));
    expect(await screen.findByRole("heading", { name: "Sign in to keep going." })).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
