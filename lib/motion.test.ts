import { describe, expect, it } from "vitest";
import { motion } from "./motion";

describe("motion rules", () => {
  it("locks page enter and auth timing", () => {
    expect(motion.pageEnterMs).toBe(400);
    expect(motion.pageEnterEase).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(motion.pageEnterY).toBe(26);
    expect(motion.authMs).toBe(450);
    expect(motion.authEase).toEqual([0.16, 1, 0.3, 1]);
    expect(motion.authY).toBe(16);
  });

  it("locks nav spring and hover", () => {
    expect(motion.navSpring).toEqual({ stiffness: 380, damping: 34 });
    expect(motion.hoverMs).toBe(150);
    expect(motion.maxNewDurationMs).toBe(500);
  });
});
