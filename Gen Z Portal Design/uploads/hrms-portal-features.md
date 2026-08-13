# halfAccessible HRMS Portal — Feature Spec

> Internal HR portal for the halfAccessible team. Built with Next.js + Supabase.
> Gen Z vibe, open culture, no corporate BS.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Styling:** Tailwind CSS + Framer Motion
- **Auth:** Magic link (email only, no passwords)
- **Deployment:** Vercel

---

## User Roles

| Role | Access |
|------|--------|
| `employee` | Submit leaves, vote on Burger Holidays, post anonymously, view team & announcements |
| `lead` | All of employee + approve/reject leaves for their team |
| `admin` | Full access — manage team, post announcements, manage all leaves |

---

## Modules

### 1. Authentication
- Magic link login (enter email → get link → you're in)
- Auto-create profile on first sign-in
- Protected routes via middleware
- Anonymous chat is public — no login required

---

### 2. Dashboard (Home)
- Personalized greeting with name
- Quick stats: pending leaves, upcoming holidays, unread announcements
- Quick action buttons: Request Leave, Vote on Holidays, Drop an Anonymous Note
- Recent activity feed

---

### 3. Leave Management

#### For Employees
- **Step 0 (always):** Sync with your POC before and during any planned leave — keep discussing, not just a one-time heads up
- Submit leave request with:
  - Leave type: Sick / Personal / Festival / Emergency / Other
  - Date range
  - Reason (optional)
  - Handoff notes (who's covering what)
  - Emergency toggle — if checked, no handoff required, inform later
- View own leave history with status badges (Pending / Approved / Rejected)

#### For Admins / Leads
- View all team leave requests
- Approve or reject with optional note
- Filter by status, date, employee

#### Leave Types
| Type | Notes |
|------|-------|
| Sick | Self-certified, no questions |
| Personal | Inform + pass work |
| Festival | All festivals are holidays; submit via portal |
| Emergency | Just go. Inform later if possible. No handoff required. |
| Other | Anything that doesn't fit above |

#### Key Policy Rules (reflected in UI)
- No rigid quota — just inform, handoff, take leave
- Emergency = zero compromise, UI skips handoff requirement
- Step 0 reminder shown on every leave form

---

### 4. Burger Holidays 🍔

> If a long weekend is just one day away, the team votes to make it a holiday. It's not a "sandwich holiday" — it's a **Burger Holiday**. Inspired by US culture, claimed by us.

- Anyone can propose a Burger Holiday
- Proposal includes: date, reason, voting deadline
- Team votes: 🍔 (yes) or 👎 (no)
- Live vote count visible to all
- Deadline countdown timer
- Auto-resolve: majority 🍔 = approved, else rejected
- Approved holidays shown in a dedicated calendar view
- Admins can manually override status

---

### 5. Anonymous Chat / Feedback Board

> No names. No tracking. No identity. Just vibes and honesty.

- Completely open — no login required to post
- No user ID stored, no IP logged
- Post categories:
  - 💬 General
  - 📣 Feedback
  - 💡 Idea
  - 🤔 Concern
  - ✨ Vibe Check
  - 🙌 Appreciation
- Optional emoji tag on each post
- Upvote messages (session-based, not user-based)
- Sorted by: Latest / Most Upvoted
- Filter by category
- No delete by admin (preserves trust) — only auto-expire after 90 days

---

### 6. Team Directory

- Grid of all team members with:
  - Avatar (initials + color)
  - Full name
  - Designation
  - Department
  - Skills tags
  - Joined date
- Click to view full profile
- Search by name, role, department, skills
- Each employee can edit their own profile (bio, skills, designation, avatar color)

---

### 7. Announcements

- Posted by admins/leads only
- Categories: General / Culture / Policy / Shoutout / Event / Update
- Pinned announcements always show at top
- Emoji reactions (👍 🔥 ❤️ 🎉 💯) — one per user per emoji
- Rich text content
- Filter by category
- Notification badge on nav when new announcements exist

---

### 8. Company Culture Features

#### Party Requests
- Any employee can request a team party via their lead
- Goes on company budget
- Simple request form: occasion, vibe, preferred date
- Lead approves → shows up in announcements as an event

#### Yearly Team Trip
- Admin creates a trip proposal poll
- Team votes on destination, dates, vibe
- Results visible to all
- Trip plan posted as a pinned announcement once decided

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, roles, skills |
| `leave_requests` | All leave submissions + status |
| `burger_holidays` | Proposed Burger Holidays |
| `burger_votes` | One vote per user per holiday |
| `anonymous_messages` | Truly anonymous posts (no user_id) |
| `anon_upvotes` | Session-based upvotes (no user_id) |
| `announcements` | Company announcements |
| `announcement_reactions` | Emoji reactions per user |

---

## Design System

- **Background:** Deep navy/dark (`#0A0A14`)
- **Primary:** Purple (`#5B2D8E`)
- **Secondary:** Teal (`#009B8D`)
- **Cards:** Glassmorphism — `bg-white/5 backdrop-blur border border-white/10`
- **Gradient:** Purple → Teal (header, CTAs, cover elements)
- **Typography:** Inter, bold headings, relaxed body
- **Motion:** Subtle slide-up + fade-in on page load
- **Tone:** Gen Z friendly, warm, no jargon

---

## Status Indicators

| Status | Color |
|--------|-------|
| Pending | 🟡 Amber |
| Approved | 🟢 Emerald |
| Rejected | 🔴 Red |
| Voting | 🔵 Blue |
| Emergency | 🟠 Orange badge |

---

## Legal / Compliance (India)

- PF, ESIC, PT, TDS mentions in policy section
- POSH Act 2013 — zero tolerance policy visible
- Payment of Gratuity Act 1972 reference
- Employment contract takes precedence over portal policies

---

## Out of Scope (v1)

- Payroll processing
- Attendance tracking / biometric
- Performance review forms
- Chat between employees (use Slack)
- Mobile app (web only, mobile-responsive)

---

*Last updated: 2025 · For internal use only · halfAccessible*
