# CXO 15-minute slots

The manage form drops a start time and a slot count. Each slot is 15 minutes. Everyone sees those times on `/cxo` and books one.

## Decisions

- Create fields are only: CXO dropdown, start (`datetime-local`), slots (`1–20`, default `1`). Submit stays `drop it`.
- End time is not typed. End is `start + count × 15 minutes`.
- Start must land on `:00`, `:15`, `:30`, or `:45`. Reject other minutes.
- One `cxo_windows` row per 15-minute slot. No new table. No new columns.
- Name, title, and avatar color come from the selected CXO profile. Tagline is always `15 minutes. no agenda.`
- Each new row has `slots_remaining: 1`. Booking still decrements that row.
- Remove **add slots** from the manage list and delete `addCxoSlots`. Need more time? Drop another window.
- Nav sub becomes `drop a window.` Access is unchanged: admin and `cxo` manage; employees book on `/cxo`.
- Copy stays lowercase and casual. No new motion or color tokens.
- Seed windows stay as they are. Same person and same start may appear more than once. Past starts are allowed.

## Data

Existing table `public.cxo_windows`. No migration.

| column | type | on create |
| --- | --- | --- |
| `name` | text | trimmed `full_name` of the selected CXO |
| `title` | text | trimmed `designation`, or `cxo` if blank; slice to 20 chars |
| `tagline` | text | `15 minutes. no agenda.` |
| `avatar_color` | text | profile `avatar_color` if it is in `AVATAR_SWATCHES`, else the first swatch |
| `window_label` | text | `formatCxoSlotLabel` for that slot’s start |
| `slots_remaining` | int | `1` |

`window_label` examples: `Aug 21 · 4:00pm`, `Aug 21 · 4:15pm`.

`createCxoWindow` loads `id, full_name, role, designation, avatar_color` for the selected profile. Missing, inactive, or non-`cxo` → `cxo required`.

Insert all slot rows in one `.insert([...])`. Revalidate `/cxo` and `/cxo/manage`.

## Access

Unchanged from the CXO role spec:

- `canManageCxoWindows` and `/cxo/manage` stay admin + `cxo`.
- Page and `createCxoWindow` keep `requireRole(ADMIN_ROLES)` and the service-role client.
- No new write RLS. `bookCxo` is unchanged.

Nav item `cxo-windows` sub: `drop a window.` (was `drop a window. add slots.`).

## Validation

Pure helpers in `lib/cxo/validate.ts` (and roster helpers already in `lib/cxo/person.ts`).

Start string is wall-clock `YYYY-MM-DDTHH:mm` from `datetime-local`. Optional `:ss` is ignored. Do not run it through a local/UTC `Date` conversion that would shift the clock time.

- `validateCxoStart(raw)` — empty → `start required`; not a real date-time → `invalid start`; minutes not in `{0,15,30,45}` → `start must be on a 15-min mark`.
- `validateCxoSlotCount(n)` — unchanged. `0`, `21`, `1.5` → `slots must be 1-20`. `1` and `20` pass.
- `formatCxoSlotLabel(raw)` — month short + day with no leading zero, then ` · ` and 12-hour time with lowercase `am`/`pm` and no leading hour zero. `2026-08-21T16:00` → `Aug 21 · 4:00pm`. `2026-08-21T00:00` → `Aug 21 · 12:00am`. `2026-08-21T12:15` → `Aug 21 · 12:15pm`.
- `cxoSlotStarts(raw, count)` — `count` labels, each 15 minutes after the last on the same wall clock. `cxoSlotStarts("2026-08-21T16:00", 4)` → `Aug 21 · 4:00pm`, `Aug 21 · 4:15pm`, `Aug 21 · 4:30pm`, `Aug 21 · 4:45pm`. A slot that passes midnight uses the next calendar day (`2026-08-21T23:30` with `2` → `Aug 21 · 11:30pm`, `Aug 22 · 12:00am`).
- `cxoTitleFromDesignation(designation)` — trim; empty → `cxo`; else slice to `CXO_TITLE_MAX` (20).
- `cxoColorFromProfile(color)` — `color` if it is in `AVATAR_SWATCHES`, else `AVATAR_SWATCHES[0]`.

`validateCxoWindow({ name, start, slots })` returns the first of `validateCxoName`, `validateCxoStart`, `validateCxoSlotCount`, or `null`. Title, tagline, and color are derived and do not come from the form.

Remove from the create path: typed title/tagline/date/note/color, `formatCxoWindowLabel`, `validateCxoDate`, `validateCxoNote`, `nextSlotsRemaining`. Delete `addCxoSlots`. Keep `validateCxoName` (max 80). `validateCxoTitle` / `validateCxoTagline` / `validateCxoColor` may stay for the derived values or be dropped if unused.

## Mutations

`app/(portal)/cxo/manage/actions.ts`:

- `createCxoWindow(formData)` — read `cxo_id`, `start`, `slots`. Resolve the CXO. Run `validateCxoWindow`. Insert `cxoSlotStarts(start, count)` rows with derived name/title/tagline/color and `slots_remaining: 1`. One batch. Any insert error → `{ ok: false, error }`. Success → `{ ok: true }`.
- Do not export `addCxoSlots`.

`bookCxo` on `/cxo` does not change.

## UI

`app/(portal)/cxo/manage/page.tsx` still loads windows (`name`, then `window_label`) and active `role = cxo` profiles. Profile select only needs `id, full_name, role` for the dropdown. Derived fields are loaded in the action.

Existing tokens and components only: `pageEnter`, 12px cards, `TextField`, `Button`, `Avatar`, `Toast`, `EmptyState`. Select keeps using `TextField.module.scss`.

### Create card

Title: `drop a window`. Fields: CXO `<select name="cxo_id">`, start `TextField` `type="datetime-local"` `name="start"`, slots `type="number"` `1–20` default `1`. No title, tagline, date, note, or swatches. Submit `drop it`, disabled when the roster is empty. Empty roster hint stays `assign the cxo role on users first`.

### Window list

One row per window: avatar, name, title, `window_label`, `{n} slots`. No count field. No **add slots**. Empty list: `EmptyState` titled `no windows yet`.

Toast the first error, or `window dropped` on success. Reset the create form after a successful create.

`/cxo` booking UI does not change. Each inserted row is already one card with its own time label.

## Tests

- `validateCxoStart`: `""` → `start required`; `2026-13-01T16:00` and `2026-02-31T16:00` → `invalid start`; `2026-08-21T16:07` → `start must be on a 15-min mark`; `2026-08-21T16:00` and `2026-08-21T16:15` pass.
- `formatCxoSlotLabel("2026-08-21T16:00")` → `Aug 21 · 4:00pm`.
- `formatCxoSlotLabel("2026-08-21T00:00")` → `Aug 21 · 12:00am`.
- `formatCxoSlotLabel("2026-08-21T12:15")` → `Aug 21 · 12:15pm`.
- `cxoSlotStarts("2026-08-21T16:00", 4)` → the four labels `4:00pm` through `4:45pm` on `Aug 21`.
- `cxoSlotStarts("2026-08-21T23:30", 2)` → `Aug 21 · 11:30pm`, `Aug 22 · 12:00am`.
- `validateCxoSlotCount`: `0`, `21`, `1.5` fail; `1` and `20` pass.
- `cxoTitleFromDesignation("")` → `cxo`; `"Chief Executive Officer"` → first 20 chars; `"CEO"` → `CEO`.
- `cxoColorFromProfile("#7048B6")` → `#7048B6`; `"#1C1C2E"` → `AVATAR_SWATCHES[0]`.
- Existing roster tests still pass. Nav test: `cxo-windows` sub is `drop a window.`
- Playwright: `/cxo/manage` still redirects to login when logged out.

No authenticated e2e for create.

## Out of scope

- Edit, close, or delete a window
- Add-slots / top-up
- A slots table, `window_on` column, or other schema change
- Changing how `bookCxo` works
- Grouping many times under one CXO card on `/cxo`
- Super admin access to `/cxo/manage`
