# Restore v2 Canvas Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live portal match `Gen Z Portal Design/halfAccessible Portal v2.dc.html` visually, after the Geist/zinc/floating-shell overhaul drifted from that source of truth.

**Architecture:** Tokens and fonts first, then the flush shell, then primitives, then page chrome. No new routes, tables, or auth flows. Dark mode is removed. Split auth stays and is retokened.

**Tech Stack:** Next.js 15 App Router, `next/font/google` (Space Grotesk + Inter), Tailwind v4 + SCSS modules, Vitest.

## Global Constraints

- Visual source of truth: `Gen Z Portal Design/halfAccessible Portal v2.dc.html` (light only).
- Display type: Space Grotesk 500/700. Body type: Inter 400/500/600/700. No Geist. No Geist Mono.
- Canvas: `#F6F6FA`. Ink: `#1C1C2E`. Accent: `#5B2D8E` / hover `#6B3AA3`. Link teal: `#00816F`. Bar teal: `#009B8D`. Ticker text: `#3D1E60`.
- Radii: cards `20px`, primary buttons `14px`, inputs `10px`, pills `999px`.
- Card chrome: `1px solid rgba(28,28,46,.09)` + `0 1px 3px rgba(28,28,46,.05)`.
- Do not change TOTP, RBAC, APIs, or copy the HTML prototype's magic-link / role-switcher behavior.
- Keep mobile bottom nav (HTML is desktop-only). Keep split auth. Remove grain overlay and all `prefers-color-scheme: dark` / `dark:` overrides.

See the attached Cursor plan for the full task breakdown.
