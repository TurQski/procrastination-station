import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyActivity } from "./momentum-dashboard";
describe("weekly activity honesty", () => {
  it("preserves the chart area without fabricating bars or totals when history is unavailable", () => {
    const { container } = render(<WeeklyActivity />);
    expect(
      screen.getByRole("heading", { name: "Weekly activity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your rhythm will take shape here."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Activity tracking will begin/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "This week" })).toBeDisabled();
    expect(container.querySelector(".recharts-bar")).toBeNull();
  });
  it("distinguishes a future tracked empty week from missing history", () => {
    render(<WeeklyActivity data={[]} />);
    expect(
      screen.getByText("No completions recorded for this week."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Activity history not available yet"),
    ).not.toBeInTheDocument();
  });
});
