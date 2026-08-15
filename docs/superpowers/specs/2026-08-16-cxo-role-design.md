# CXO portal role

Add an assignable `cxo` role with the same portal permissions as `admin`. Super admin stays separate.

## Decisions

- New role slug: `cxo`. Chip and sidebar label: `cxo`.
- Same powers as `admin`: full BASE nav, users, holidays, CXO windows, leave decisions, announcements, burger override, culture admin actions.
- Not the same as `super_admin`: no portal config, no department mutations.
- Visible on `/users`, `/team`, and other people lists. Only `super_admin` stays hidden.
- Assignable on `/users` by admin, super admin, and cxo. Nobody assigns `super_admin`.
- Add `|| role === "cxo"` (or `'cxo'` in SQL) next to each existing admin check. Do not add a permissions table.
- Booking windows on `/cxo` stay typed names. This role does not change how windows are created or booked.
- First user is still `super_admin`. Existing rows are unchanged.

## Data

Migration `supabase/migrations/0010_cxo_role.sql`:

- Drop `profiles_role_check` and re-add: `role in ('employee', 'lead', 'admin', 'super_admin', 'cxo')`.
- `is_admin()` → `current_profile_role() in ('admin', 'cxo')`.
- `is_lead_or_admin()` → `current_profile_role() in ('lead', 'admin', 'cxo')`.

`ProfileRole` in `lib/types.ts` becomes `"employee" | "lead" | "admin" | "super_admin" | "cxo"`.

No new table. No seed of a cxo user.

## Access

Update these exact checks:

| place | change |
| --- | --- |
| `isAdminRole` | `role === "admin" \|\| role === "cxo"` |
| `ADMIN_ROLES` | `["admin", "cxo"]` |
| `LEAD_OR_ADMIN_ROLES` | `["lead", "admin", "cxo"]` |
| `USER_MANAGER_ROLES` | `["admin", "super_admin", "cxo"]` |
| `canVisitPath` `/users` and `/cxo/manage` | `role === "admin" \|\| role === "cxo"` |
| `getNavItems` | `role === "admin" \|\| role === "cxo"` uses `[...BASE, USERS, CXO_WINDOWS]` |
| CXO manage page and actions | `requireRole(ADMIN_ROLES)` instead of `requireRole(["admin"])` |

Leaves, announcements, burgers, and culture keep using `isAdminRole`, `ADMIN_ROLES`, or `LEAD_OR_ADMIN_ROLES`. They pick up `cxo` from those updates. Do not leave a leftover `requireRole(["admin"])` or `role === "admin"` that excludes `cxo`.

`canManageSettings` and `canManageDepartments` stay super admin only.

`isVisiblePerson("cxo")` is true (only `super_admin` is false).

`validateInvite` / `setRole`: `cxo` is valid; `super_admin` is still `invalid role`.

## UI

`ROLES` on `/users` is `["employee", "lead", "admin", "cxo"]`. No other new UI. Sidebar already shows `profile.role`.

## Tests

- `isAdminRole("cxo")` true; employee and lead false; admin still true.
- `canDecideLeave`, `canInsertAnnouncement`, `canManageUsers`, `canManageHolidays`, `canManageCxoWindows` true for `cxo`.
- `canManageSettings("cxo")` and `canManageDepartments("cxo")` false.
- `canVisitPath("cxo", "/users")` and `"/cxo/manage"` true; `"/settings"` false; `canVisitPath("cxo", "/cxo")` true.
- `getNavItems("cxo")` has length 11 and the same ids as admin, including `cxo-windows` after `users`.
- `validateInvite` with `role: "cxo"` is null; `super_admin` still `invalid role`.
- `isVisiblePerson("cxo")` true.

No authenticated e2e.

## Out of scope

- Linking `/cxo` booking windows to people with the `cxo` role
- Super admin inheriting admin/cxo portal pages
- A permissions table or extra roles
- Changing first-user bootstrap
