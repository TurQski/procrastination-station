import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalPlanner } from "./goal-planner";
describe("goal input", () => {
  it("starts empty and explicitly communicates that previews are not saved", () => {
    render(<GoalPlanner />);
    expect(screen.getByText(/goals aren’t saved yet/)).toBeInTheDocument();
    expect(screen.getByText(/Your first step starts above/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
  it("validates empty input and focuses the field", async () => {
    const user = userEvent.setup();
    render(<GoalPlanner />);
    await user.click(screen.getByRole("button", { name: /Find my first step/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/);
    expect(screen.getByLabelText("I want to…")).toHaveFocus();
  });
  it("creates a preview and removes stale results when the input changes", async () => {
    const user = userEvent.setup();
    render(<GoalPlanner />);
    const input = screen.getByLabelText("I want to…");
    await user.type(input, "Finish my history essay");
    await user.click(screen.getByRole("button", { name: /Find my first step/ }));
    expect(screen.getByRole("heading", { name: "Finish my history essay" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Not saved")).toBeInTheDocument();
    await user.type(input, " tomorrow");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
  it("rejects a past target date and preserves entered text", async () => {
    const user = userEvent.setup();
    render(<GoalPlanner />);
    await user.type(screen.getByLabelText("I want to…"), "Finish my history essay");
    await user.type(screen.getByLabelText(/Aim to finish by/), "2000-01-01");
    await user.click(screen.getByRole("button", { name: /Find my first step/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/today or later/);
    expect(screen.getByLabelText("I want to…")).toHaveValue("Finish my history essay");
  });
});
