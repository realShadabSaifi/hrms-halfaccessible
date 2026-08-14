export const motion = {
  pageEnterMs: 400,
  pageEnterEase: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  pageEnterY: 26,
  authMs: 450,
  authEase: [0.16, 1, 0.3, 1] as const,
  authY: 16,
  navSpring: { stiffness: 380, damping: 34 },
  hoverMs: 150,
  maxNewDurationMs: 500,
} as const;
