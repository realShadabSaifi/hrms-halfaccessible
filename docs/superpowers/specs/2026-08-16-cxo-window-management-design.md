# CXO window management

Admin opens booking windows and adds slots from a dedicated manage page. Employees keep booking on `/cxo`.

## Decisions

- `/cxo` stays the booking page for every role that can visit it, including admin.
- Admin-only page at `/cxo/manage`. Create a window or add slots. No edit, close, or delete.
- New admin nav item **CXO windows**, after user management. Sub: `drop a window. add slots.`
- Super admin does not see the item or the route. Leads and employees do not either.
- CXO identity is typed: name, title, tagline. They do not have to be a portal user.
- Window time is a date plus an optional short note. Stored as `window_label` text. No new columns.
- Slot count on create and on top-up is 1–20.
- New windows pick an avatar from the six portal swatches. Seed windows keep their existing colors.
- Writes use `requireRole(["admin"])` and the service-role client. No new write RLS on `cxo_windows`.
- Copy stays lowercase and casual.

## Data

Existing table `public.cxo_windows`. No migration.

| column | type | on create |
| --- | --- | --- |
| `name` | text | trimmed name |
| `title` | text | trimmed title |
| `tagline` | text | trimmed tagline |
| `avatar_color` | text | chosen swatch |
| `window_label` | text | formatted from date + optional note |
| `slots_remaining` | int | create count, `>= 0` |

`window_label` examples: `Aug 21` or `Aug 21 · after all-hands`.

Seed rows are unchanged. Same person and same date may appear more than once. Past dates are allowed.

## Access

- `canManageCxoWindows(role)` is true only for `admin`.
- `canVisitPath`: `/cxo/manage` is true only for `admin`. Employee, lead, and super_admin are false. `/cxo` is unchanged.
- Nav item: `id: "cxo-windows"`, `href: "/cxo/manage"`, `label` and `title`: `CXO windows`, `sub`: `drop a window. add slots.`
- `getNavItems("admin")` is `[...BASE, USERS, CXO_WINDOWS]`. Other roles unchanged. Admin item count becomes 11.
- Page and actions call `requireRole(["admin"])`.
- Insert and increment run as service-role after that check. Do not add authenticated insert/update policies for create or top-up. Existing booking update on `/cxo` stays as it is.

## Validation

Pure helpers in `lib/cxo/`:

- `validateCxoName(name)` — empty → `name required`; over 40 → `name too long`.
- `validateCxoTitle(title)` — empty → `title required`; over 20 → `title too long`.
- `validateCxoTagline(tagline)` — empty → `tagline required`; over 80 → `tagline too long`.
- `validateCxoDate(iso)` — same rules as `validateHolidayDate`: empty → `date required`; not a real `YYYY-MM-DD` → `invalid date`.
- `validateCxoNote(note)` — empty after trim is fine; over 40 → `note too long`.
- `validateCxoSlotCount(n)` — parse as integer first (`Number.parseInt` / whole number). `NaN`, non-integer, or outside 1–20 → `slots must be 1-20`.
- `validateCxoColor(color)` — must be in `AVATAR_SWATCHES` → else `invalid color`.
- `formatCxoWindowLabel(iso, note)` — UTC month short + day with no leading zero (`Aug 21`). Trimmed note appends ` · {note}`. Empty note is date only.
- `nextSlotsRemaining(current, add)` — `current + add` after `validateCxoSlotCount(add)` passes. Does not cap the total.

`validateCxoWindow({ name, title, tagline, date, note, slots, color })` returns the first field error, or `null`.

## Mutations

Both live in `app/(portal)/cxo/manage/actions.ts`. Return `{ ok: true } | { ok: false, error: string }`.

- `createCxoWindow(formData)` — read fields, run `validateCxoWindow`, insert one row with `formatCxoWindowLabel`. Revalidate `/cxo` and `/cxo/manage`.
- `addCxoSlots(id, count)` — missing id → `missing window`. Invalid count → `slots must be 1-20`. Unknown id → `missing window`. Else set `slots_remaining` to `nextSlotsRemaining`. Revalidate both paths.

Booking `bookCxo` on `/cxo` does not change. Employees and leads never call the manage actions.

## UI

`app/(portal)/cxo/manage/page.tsx` loads all `cxo_windows` ordered by `name`, then `window_label`, and renders `CxoManageClient`.

Existing tokens and components only: `pageEnter`, 12px cards, `TextField`, `Button`, `Avatar`, `Toast`, `EmptyState`. Swatch buttons match user details (34px circle, ink border when selected). No new motion. No new color tokens.

### Create card

Title: `drop a window`. Fields: name, title, tagline, date (`type="date"`), optional note, slot count (`type="number"`, 1–20), six swatches, submit `drop it`. Default swatch is the first in `AVATAR_SWATCHES`. Default slot count is `1`.

### Window list

One row per window: avatar, name, title, `window_label`, `{n} slots`, a small count field (default `1`), button `add slots`. Empty list: `EmptyState` titled `no windows yet`.

Toast the first error string, or `window dropped` / `slots added` on success. Reset the create form after a successful create.

`/cxo` booking UI does not change.

## Tests

- Each validator: empty, too long, valid. Date: `""`, `2026-13-01`, `2026-02-31`, `2026-08-21`.
- `formatCxoWindowLabel("2026-08-21", "")` → `Aug 21`. With `after all-hands` → `Aug 21 · after all-hands`.
- `validateCxoSlotCount`: `0`, `21`, `1.5` fail; `1` and `20` pass.
- `nextSlotsRemaining(2, 3)` → `5`.
- `canManageCxoWindows` true only for `admin`.
- `canVisitPath("admin", "/cxo/manage")` true; employee, lead, super_admin false. `canVisitPath("admin", "/cxo")` still true.
- `getNavItems("admin")` includes `cxo-windows` after `users`. Employee and super_admin lists unchanged (9 and 3 items).
- Playwright: `/cxo/manage` redirects to login when logged out.

## Out of scope

- Edit, close, or delete a window
- Picking a CXO from the team roster
- Date + start/end time pickers
- A `window_on` column or other schema change
- Super admin access to `/cxo` or `/cxo/manage`
- Authenticated e2e for create or top-up
- Changing how employees book on `/cxo`
