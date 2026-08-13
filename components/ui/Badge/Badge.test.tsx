import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./index";

describe("Badge", () => {
  it.each([
    ["Pending", "pending"],
    ["Approved", "approved"],
    ["Rejected", "rejected"],
    ["Voting", "voting"],
    ["Emergency", "emergency"],
  ] as const)("applies the %s status class", (status, slug) => {
    render(<Badge status={status} />);
    expect(screen.getByText(status)).toHaveAttribute("data-status", status);
    expect(screen.getByText(status).className.toLowerCase()).toContain(slug);
  });
});
