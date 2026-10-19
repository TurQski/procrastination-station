import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("./station-dashboard", () => ({
  Dashboard: () => <div>Workspace preview</div>,
}));
import { StationHome } from "./station-home";
describe("approved homepage functional integration", () => {
  it("keeps advanced planning and saving out of the initial visual presentation", () => {
    render(<StationHome />);
    expect(
      screen.getByLabelText("What have you been meaning to do?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Time for a first version"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save to my goals" }),
    ).not.toBeInTheDocument();
    expect(screen.getByAltText(/Luminous blue and purple/)).toHaveAttribute(
      "src",
      "/images/ribbon.png",
    );
  });
  it("validates before generating a real five-step plan", async () => {
    const user = userEvent.setup();
    render(<StationHome />);
    await user.click(
      screen.getByRole("button", { name: "Find my first step" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "at least 8 characters",
    );
    await user.type(
      screen.getByLabelText("What have you been meaning to do?"),
      "Finish my software project",
    );
    await user.click(
      screen.getByRole("button", { name: "Find my first step" }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByText("60 minutes total", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save to my goals" }),
    ).toBeInTheDocument();
  });
  it("prevents stale saves while editing a deadline and lets the user correct an invalid date", async () => {
    const user = userEvent.setup();
    render(<StationHome />);
    await user.type(
      screen.getByLabelText("What have you been meaning to do?"),
      "Finish my software project",
    );
    await user.click(
      screen.getByRole("button", { name: "Find my first step" }),
    );
    const date = screen.getByLabelText("Aim to finish by");
    await user.type(date, "2000-01-01");
    expect(
      screen.queryByRole("button", { name: "Save to my goals" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Update my plan" }));
    expect(screen.getByRole("alert")).toHaveTextContent("today or later");
    expect(date).toBeInTheDocument();
    await user.clear(date);
    await user.click(screen.getByRole("button", { name: "Update my plan" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save to my goals" }),
    ).toBeInTheDocument();
  });
});
