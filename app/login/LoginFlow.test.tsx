import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginFlow } from "./LoginFlow";
import { startLoginAction } from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: function Image() {
    return null;
  },
}));

vi.mock("./actions", () => ({
  startLoginAction: vi.fn(),
  verifyLoginAction: vi.fn(),
}));

vi.mock("./afterAuth", () => ({
  pathAfterAuth: vi.fn(),
}));

const settings = { app_name: "halfAccessible", logo_path: null, logo_url: null };

describe("LoginFlow", () => {
  beforeEach(() => {
    vi.mocked(startLoginAction).mockResolvedValue({ needsTotp: true });
  });

  it("keeps the authenticator field empty without flipping controlled mode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<LoginFlow settings={settings} />);
    fireEvent.change(screen.getByLabelText("email"), {
      target: { value: "you@halfaccessible.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "continue" }));

    const code = await screen.findByLabelText("authenticator code");
    expect(code).toHaveValue("");
    expect(error.mock.calls.flat().join(" ")).not.toMatch(
      /uncontrolled input to be controlled/i,
    );

    error.mockRestore();
  });
});
