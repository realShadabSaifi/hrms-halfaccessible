# Department management

Super admin owns the live department list. Everyone else only picks from it.

## Decisions

- Super admin adds, renames, and removes departments.
- The manage UI is a card on `/users`. Admin does not see that card.
- Remove is blocked while any profile still has that department name.
- The last remaining department cannot be removed.
- Storage is a `departments` table. `profiles.department` stays text.
- Rename rewrites matching `profiles.department` values to the new name.

## Data

Table `public.departments`:

| column | type | rules |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `name` | text | trimmed, 1–40 chars, unique on `lower(name)` |
| `sort` | int | insertion order; new row is `max(sort) + 1` |
| `created_at` | timestamptz | default `now()` |

Seed on migrate: Engineering, Design, Product, HR, Marketing (in that `sort` order). Unique on `lower(name)` with `on conflict do nothing` so a re-apply does not overwrite renamed rows.

`profiles.department` remains `text`. No foreign key in this version.

## Access

- `canManageDepartments(role)` is true only for `super_admin`.
- Select: any authenticated user (team and user chips need the list).
- Insert / update / delete: service-role actions after `requireRole(["super_admin"])`. Do not open write RLS to authenticated.
- Admin and employee never call the mutate actions.

## Validation

Shared helpers in `lib/departments/`:

- `validateDepartmentName(name)` — empty → `name required`; over 40 → `name too long`.
- Duplicate check is case-insensitive (`Engineering` vs `engineering`).
- `validateProfileDetails` takes the live name list (or a `Set`) instead of the hardcoded `DEPARTMENTS` const. Unknown name still returns `invalid department`.
- Hardcoded `DEPARTMENTS` is removed. Avatar swatches stay hardcoded.

## Mutations

All return `{ ok: true } | { ok: false, error: string }`.

- `addDepartment(name)` — validate, reject duplicate, insert.
- `renameDepartment(id, name)` — validate, reject duplicate (other rows), update the row, then `update profiles set department = new where department = old` (exact old stored name).
- `removeDepartment(id)` — if any profile has that name → `move people first`. If it is the only row → `keep at least one`. Otherwise delete.

## UI

`/users` and `/team` load `departments` ordered by `sort` and pass the names into the clients.

On `/users`, a “departments” card (12px radius, existing TextField / Button / Toast, no new motion):

- Super admin: list with inline rename + remove, plus one add field.
- Admin: card hidden. Add-human and edit-details chips still use the live list.
- Blocked remove / bad name → toast with the validator error.
- Team self-edit chips use the same list. If a profile’s stored department is not in the list, chips show live names only; save requires picking a current one.

Copy stays lowercase and casual.

## Tests

- Name required / too long / duplicate (case-insensitive).
- Remove blocked when in use.
- Remove blocked when last row.
- `canManageDepartments("super_admin")` true; admin, lead, employee false.
- Profile details reject a name that is not in the provided list.

Manual: super admin add/rename/remove on `/users`; admin sees chips only; employee self-edit shows the new name.

## Out of scope

- Foreign key from `profiles` to `departments`
- Drag-to-reorder
- Admin or employee mutating the list
- Department UI on portal config
- Changing designation, skills, or other profile fields
