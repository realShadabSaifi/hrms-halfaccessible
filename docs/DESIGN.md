# Portal design and motion rules

Written source of truth for color, type, shape, and motion. Visual reference remains `Gen Z Portal Design/halfAccessible Portal v2.dc.html`. New UI must follow these rules. Do not invent new tokens.

## Color (light only)

- Canvas `#F7F5FC`. Ink `#39325A`. Muted `rgba(57,50,90,0.55)`.
- Surface `#FFFFFF`. Line `rgba(57,50,90,0.08)`. Card border `1px solid rgba(57,50,90,0.09)`. Card shadow `0 1px 3px rgba(57,50,90,0.05)`.
- Accent `#7463D4`. Hover `#8577E0`. Soft `#564AA5`. Wash `rgba(116,99,212,0.07)`.
- Portal links `#00816F` hover `#7463D4`. Auth links `#7463D4` hover `#8577E0`. Bar teal `#009B8D`. Danger `#B91C1C`.
- No dark mode. No extra brand colors except the six avatar swatches: `#7048B6`, `#0E9488`, `#D97706`, `#DB2777`, `#0284C7`, `#65A30D`.

## Type

- Display: Baloo 2 500/600/700 via `--font-display`. Body: Nunito 400/600/700/800 via `--font-body`.
- Page title 26px / 700. Card title 16–17px / 700. Body 13.5–14px. Meta 11–12.5px. Labels 11.5px uppercase tracking-wider.
- Copy is lowercase and casual. No sentence-case corporate headings.

## Shape and focus

- Cards 12px. Portal buttons 8px. Portal inputs 6px. Auth buttons 14px. Auth inputs 10px. Pills 999px. Profile modal 24px.
- Focus: `3px solid rgba(116,99,212,0.45)`, offset 2px, radius 4px portal / 6px auth.

## Motion (strict)

Locked values live in `lib/motion.ts`.

- Page enter: `slideUp` 400ms `cubic-bezier(0.2, 0.8, 0.2, 1)` via `.pageEnter` only. Distance 26px.
- Fade: 400ms ease (existing `fadeIn` on PageHeader).
- Auth panel: opacity + `y: 16`, 450ms `[0.16, 1, 0.3, 1]`.
- Nav active pill: Motion spring `stiffness: 380`, `damping: 34`, `layoutId: "nav-active"`.
- Hover shift: sidebar `translateX(4px)` 150ms ease. Team cards `translateY(-6px)` 150ms ease. No new hover axes.
- Toast: `toastIn` 18px up. Modal: fade overlay only, no extra scale unless already present.
- Forbidden on new work: bounce easings, durations over 500ms (except burger `fall` / ticker `marquee`), parallax, scroll-jacking, autoplay video, layout animations other than `nav-active`.
- `prefers-reduced-motion: reduce` must zero animation/transition duration (existing global rule). Do not add motion that ignores it.
