import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthPanel } from "./auth-panel";
const fetcher = vi.fn();
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
describe("password sign-in interface", () => {
  it("masks the password, submits sign-in, and clears it after success", async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ user: { id: "a" } })));
    const user = userEvent.setup(); const onAuthenticated = vi.fn();
    render(<AuthPanel onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByLabelText("Email address"), "tester@example.com");
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    await user.type(password, "test password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(fetcher).toHaveBeenCalledWith("/api/auth/signin", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "tester@example.com", password: "test password" }) }));
    expect(onAuthenticated).toHaveBeenCalledOnce();
    expect(password).toHaveValue("");
  });
  it("clears an incorrect password and allows retry without losing the email", async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ error: "Email or password is incorrect." }), { status: 401 }));
    const user = userEvent.setup(); const onAuthenticated = vi.fn();
    render(<AuthPanel onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByLabelText("Email address"), "tester@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Email address")).toHaveValue("tester@example.com");
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
