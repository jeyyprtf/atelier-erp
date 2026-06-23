# Atelier — Team ERP

Internal ERP for a small team. Modules: My Tasks (individual Kanban), Team Progress, Task Assignment, Meeting Notes. Auth + roles via Supabase.

## Stack
- React 19 + **JSX (never TSX)** + Vite 8
- Tailwind v4 (CSS-first, tokens in `src/index.css` `@theme`) — no tailwind.config
- Framer Motion (animation), @dnd-kit (Kanban drag & drop)
- Supabase: Auth + Postgres + RLS (`@supabase/supabase-js`), connected via MCP for schema work

## Run
```
npm run dev      # vite dev server
npm run build    # prod build
```
`.env` holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY` (publishable). Supabase project ref: `lshshrbqyspnxymeiwdk`.

## Data model (see Supabase migrations 001–005)
- `profiles` (id→auth.users, full_name, email, role, avatar_url) — role: `c_level | lead | member`
- `tasks` (title, description, status, progress, deadline, pic_id, created_by) — status: `todo | in_progress | approval_pending | done`; `progress` null ⇒ baseline from status (0/33/66/100), see `effectiveProgress()` in `src/lib/supabase.js`
- `task_assignees` (task_id, profile_id) — many-to-many
- `meetings` (title, meeting_date, description, notes, created_by)

## Permissions (enforced by RLS, not just UI)
- All authenticated: read everything; create/edit meetings (edit = creator or c_level)
- Create/assign tasks: **lead + c_level** only
- Edit/delete task: c_level (any), lead (own-created), assignee/PIC (their task)
- Change roles: **c_level only** (`prevent_role_change` trigger; admin/MCP context bypasses)
- New signups → `member` by default (trigger `handle_new_user`). First C-Level was seeded directly in `auth.users` (MCP has no auth-admin tool).

## Theme, Profile & OAuth
- Dark mode: `src/lib/theme.jsx` (ThemeProvider). Tokens flip via `html.dark` overriding the same `--color-*` vars in `src/index.css`, so every `bg-bone`/`text-ink` adapts automatically. 3-way control (Light/Dark/System) on `/profile`; quick toggle in sidebar. FOUC-guard script in `index.html`.
- Profile page (`/profile`): edit display name, change password, theme. Avatar = `avatar_url` image if present, else initials.
- Google login: `signInWithGoogle()` in AuthProvider. Requires enabling the Google provider in Supabase Dashboard (Auth → Sign In / Providers) + Google Cloud OAuth client with redirect `https://lshshrbqyspnxymeiwdk.supabase.co/auth/v1/callback`, and adding the app origin to Auth → URL Configuration → Redirect URLs. Trigger `handle_new_user` (migration 007) pulls full_name/avatar from OAuth metadata.
- Leaked-password protection lives under Auth → **Attack Protection** (not Policies).

## Conventions
- Lazy/ponytail: native + stdlib first, shortest working diff, no speculative abstractions.
- Shared UI primitives in `src/components/ui.jsx`. Design = art gallery: bone canvas, hairline borders, Fraunces display + Inter body, single clay accent, smooth motion.
- Comms with the user: Indonesian.
