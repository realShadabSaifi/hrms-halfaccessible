# Chat and Web Push

Lean text DMs and named group chat on the existing Next.js + Supabase portal, plus Web Push so a phone (browser or Add to Home Screen) is pinged for new chat messages, announcements, and leave decisions. No native app.

## Decisions

- Stay on Supabase + the Web Push API. No Stream, Sendbird, OneSignal, Capacitor, or Expo.
- V1 chat is text only: no files, reactions, threads, typing indicators, read receipts, edits, or deletes.
- Any active visible person (not `super_admin`) can DM any other visible person and can create a named group.
- Group: any member can add people; any member can leave; only `created_by` can remove others; creator leaving transfers `created_by` to the earliest remaining member.
- DM: exactly two members, find-or-create by `dm_key` (`minUuid:maxUuid`), no leave, no third person.
- Message body 1–2000 chars. Group title 1–60 chars. Push preview 120 chars. Send rate limit 30/minute.
- Super admin stays off `/chat`.
- Push never fails `sendMessage` / `postAnnouncement` / `decideLeave`. Delete subscriptions that return 410/404.
- iOS notifications only after Add to Home Screen (Safari 16.4+). Say that on the `/chat` prompt card.
- Chat ships first and is usable in the tab without push.

## Data

Migration `supabase/migrations/0011_chat_and_push.sql`:

- `conversations`: `id`, `kind` (`dm` | `group`), `title`, `dm_key` (unique, required for DMs, null for groups), `created_by`, `created_at`, `last_message_at`
- `conversation_members`: `(conversation_id, user_id)` PK, `joined_at`, `last_read_at`
- `messages`: `id`, `conversation_id`, `sender_id`, `body`, `created_at`
- `push_subscriptions`: `id`, `user_id`, `endpoint` unique, `p256dh`, `auth`, `created_at`
- `is_conversation_member(uuid)` and `unread_chat_count()` (security definer)
- Trigger bumps `last_message_at` on message insert
- RLS: members see their conversations and messages; push rows are per-user; send to others uses the service-role client
- Realtime publication includes `messages` and `conversation_members`

## Access

- `canUseChat(role)` is true for everyone except `super_admin`
- `getNavItems(role, unreadAnnouncements, unreadChat)` — chat sits after home; badge is conversation count with unread
- Mobile primary tabs: `dash`, `chat`, `leaves`, `burgers`. Anon moves to more.
- Routes: `/chat` inbox, `/chat/[id]` thread. Desktop split from 768px.

## Actions

`openDm`, `createGroup`, `sendMessage`, `markRead`, `addGroupMembers`, `removeGroupMember`, `leaveGroup`, then `registerPush` / `unregisterPush`.

Notify hooks (no-op in phase 1, real send in phase 2):

- Chat: other members
- Announcement: all active visible people except author
- Leave decision: requester

## Push

- VAPID env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `public/sw.js` plus `app/manifest.ts` (`display: standalone`)
- Toggle on `/chat`: **phone pings**. Focused thread suppresses that conversation’s toast.

## Tests

- Vitest for validators, inbox/unread, payloads, send (mocked `web-push`), nav, access, isolation
- Playwright: `/chat` and `/chat/:id` redirect to login (no TOTP login helper)
- No live Web Push delivery in CI

## Out of scope

- Files, reactions, threads, typing, read receipts
- Kicking by non-creators
- Native apps, FCM/APNs, OneSignal
- Logged-in Playwright chat
