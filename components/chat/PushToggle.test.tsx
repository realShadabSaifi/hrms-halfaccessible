import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PushToggle } from "./PushToggle";

vi.mock("@/lib/push/register", () => ({
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  syncPushIfGranted: vi.fn(),
}));

describe("PushToggle", () => {
  it("offers desktop and phone pings", () => {
    render(<PushToggle />);
    expect(screen.getByRole("switch", { name: /pings/i })).toBeInTheDocument();
    expect(screen.getByText(/this computer and your phone/i)).toBeInTheDocument();
  });
});
