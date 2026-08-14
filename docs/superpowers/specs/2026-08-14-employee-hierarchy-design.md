# Employee hierarchy

Admin and super admin build a reporting tree on `/users` by dragging people. Everyone sees that tree on `/team`.

## Decisions

- Full tree: anyone can report to anyone. One manager per person. `null` manager means they are a root.
- Multiple roots are allowed. Roots sit at the top of the `/team` tree, mixed together.
- Only `admin` and `super_admin` change reporting, on `/users`. `/team` is read-only for every role.
- Assignment is drag-only. Drop a person onto another person to nest them. Drop on the unassign strip to make them a root. No manager dropdown.
- `/team` replaces the card grid with an indented tree. Search stays. Click opens the same profile modal.
- Deactivate auto-unassigns that person’s reports (`manager_id = null`). Reactivate does not restore those links.
- Moving a person keeps their subtree. Only that person’s `manager_id` changes.
- Cycles and self-manage are rejected. Copy stays lowercase and casual.
- Never show `super_admin` to anyone. They do not appear on `/users`, `/team`, or any other people list or name label. They cannot sit in the tree as a manager or a report. The word `super_admin` is not shown in the UI. Super admin can still use `/users` to build the tree; they are just not a row in it.

## Data

Column on `public.profiles`:

| column | type | rules |
| --- | --- | --- |
| `manager_id` | uuid, nullable | FK to `profiles(id)` on delete set null. Default `null`. |

No extra table. Existing profile columns stay as they are.

`Profile` in `lib/types.ts` gains `manager_id: string | null`.

## Access

- `canManageUsers` already covers `admin` and `super_admin`. Reuse it. Do not add a new capability flag.
- `setManager` and the deactivate-clear step run as service-role actions after `requireRole(USER_MANAGER_ROLES)`.
- Do not open a write RLS policy that lets authenticated users change `manager_id`.
- Tighten `profiles_update_self` (or add a trigger) so a self-edit cannot change `manager_id`. Service-role writes still work (`auth.uid()` is null).
- Leads and employees never call `setManager`.
- `isVisiblePerson(role)` is true for every role except `super_admin`. `/users` and `/team` load only visible people. Leave and culture name lookups skip them too.

## Validation

Pure helpers in `lib/hierarchy/`:

- `wouldCycle(personId, managerId, people)` — true if `managerId` is `personId` or sits in `personId`’s current subtree.
- `validateManager(personId, managerId, people)` — `null` manager is valid (unassign). Unknown person or manager id → `unknown person`. Cycle / self → `that would loop the tree`. A `super_admin` id as person or manager is `unknown person`. Same manager already set → treat as success at the action layer (no-op), not an error.
- `isVisiblePerson(role)` — false only for `super_admin`.
- `buildTree(people)` — people whose `manager_id` is null, or whose manager is not in the given set, are roots. Children nest under their manager. Roots and each child list sort by `full_name`.
- `filterTree(nodes, query)` — reuse `matchesMember` for the query. Keep a node if it or any descendant matches. Ancestors of a match stay visible so the path is readable. Empty query returns the full tree.

`people` is the in-memory roster passed into the helper (visible profiles on `/users`, visible active profiles on `/team`). Super admin is never in that set. If someone’s `manager_id` points at a hidden or inactive profile, `buildTree` treats them as a root.

## Mutations

All return `{ ok: true } | { ok: false, error: string }`.

- `setManager(personId, managerId)` — `managerId` is `string | null`. Load profiles, run `validateManager`, update that one row’s `manager_id`. Revalidate `/users` and `/team`.
- `setActive(userId, active)` when `active` is `false`: in one transaction (RPC `set_profile_active`), set `manager_id = null` on every row where `manager_id = userId`, then set `active = false` and the existing auth `deactivated` metadata. If either step fails, roll back and leave them active with reports intact. When `active` is `true`, only reactivate. Do not rewrite old `manager_id` values.

## UI

### `/users`

Roster stays a flat list (roles, edit details, deactivate, add human unchanged).

- Unassign strip at the top of the roster: “drop here to make them a root.”
- Every visible row is draggable and a drop target, including leads, admins, and inactive people. Super admin is not in the list.
- Drop A on B → `setManager(A, B)`. Drop A on the strip → `setManager(A, null)`.
- Hover / drag-over uses accent `#7463D4` border and wash. Dragged row opacity `0.35`.
- Forbidden drop (self or cycle): no write, toast `that would loop the tree`.
- Success toasts: `{first} now reports to {first}` or `{first} is a root`. First name is the first token of `full_name`.
- Keyboard: rows and the strip are focusable. Space or Enter picks up the focused person; Space or Enter on a target drops. No manager dropdown.
- Existing 12px cards, chips, toasts. No new motion.

### `/team`

- Card grid is removed. Search field stays (`matchesMember`).
- Render `filterTree(buildTree(members), q)` as indented rows: avatar, name, `designation · department`. Indent follows depth. A light accent-wash vertical guide marks the nest.
- Click a row → existing profile modal. Self-edit fields unchanged. Modal does not edit `manager_id`.
- No drag on this page.
- Empty roster: existing empty state. Search with no hits: existing “nobody matches that vibe.”
- Inactive people and `super_admin` are not loaded. If someone’s manager is inactive or hidden, `buildTree` treats them as a root.

## Tests

- `wouldCycle` / `validateManager`: self, descendant, valid nest, unassign, unknown id.
- `buildTree`: multiple roots, nested child, missing/inactive manager → child is a root, sort by name.
- `filterTree`: match keeps ancestors; empty query is the full tree; no match is `[]`.
- `setManager` gated to admin / super_admin (policy helper or action test).
- Deactivate clears reports; reactivate does not restore. Failed deactivate leaves reports intact.
- Self-update cannot change `manager_id`.
- `isVisiblePerson("super_admin")` is false; other roles true. Super admin never appears in `/users` or `/team` fixtures.

Manual: admin drag on `/users` nests and unassigns; cycle toasts; `/team` shows the tree and search keeps the path; employee cannot change reporting.

## Out of scope

- Manager dropdown
- Classic org-chart boxes and connector lines
- Drag on `/team`
- Leads editing the tree
- Using hierarchy for leave approval (any lead/admin still approves)
- Required single root
- Restoring reports on reactivate
