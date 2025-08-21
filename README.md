# HKUST MPhil TIE – Weekly Progress Tracker (Supabase)

A zero-backend Single Page App that persists data to Supabase tables. Ships with in-memory demo data for read-only mode and a one-click seed to populate your Supabase project.

## Overview
- Frontend: vanilla HTML/CSS/JS (no build step). Files: `index.html`, `style.css`, `app.js`.
- Storage: Supabase Postgres via `@supabase/supabase-js` (CDN).
- Data model: five tables mirroring the previous CSV layout:
  - `students`
  - `weekly_entries`
  - `teams`
  - `team_memberships`
  - `team_weekly_entries`

## Prerequisites
- Supabase account and a project
- Supabase Project URL and anon/public key
- Optional: basic SQL familiarity to run the schema

## 1) Create the database schema in Supabase
Open the Supabase SQL editor and run the following in your project.

Note: We allow the app to provide `id` values from the client. Defaults are still present for convenience if you insert via SQL.

```sql
-- Enable uuid generation
create extension if not exists pgcrypto;

-- students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  cohort text,
  start_date date,
  status text,
  notes text,
  research_area text,
  supervisor text,
  created_at timestamptz,
  updated_at timestamptz
);

-- weekly_entries
create table if not exists public.weekly_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  week_start_date date not null,
  goals_set_json jsonb not null,
  per_goal_status_json jsonb not null,
  overall_status text not null,
  progress_notes text,
  next_week_goals_json jsonb not null,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  constraint weekly_entries_unique_per_student_week unique (student_id, week_start_date)
);

-- teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  description text,
  created_at timestamptz,
  updated_at timestamptz
);

-- team_memberships
create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  role_in_team text,
  created_at timestamptz
);

-- team_weekly_entries
create table if not exists public.team_weekly_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_start_date date not null,
  team_goals_set_json jsonb not null,
  team_overall_status text not null,
  team_progress_notes text,
  next_week_team_goals_json jsonb not null,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  constraint team_weekly_entries_unique_per_team_week unique (team_id, week_start_date)
);
```

### Recommended indexes (optional)
```sql
create index if not exists idx_weekly_entries_student_week on public.weekly_entries (student_id, week_start_date);
create index if not exists idx_team_weekly_entries_team_week on public.team_weekly_entries (team_id, week_start_date);
```

## 2) Enable RLS and add demo policies
Row Level Security (RLS) should be enabled in production. For this demo SPA, you can permit the anon key to read and write. For real deployments, restrict policies to authenticated users and roles.

```sql
-- Enable RLS
alter table public.students enable row level security;
alter table public.weekly_entries enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_weekly_entries enable row level security;

-- DEMO POLICIES (broad permissions). Adjust for production usage.
-- Read policies
create policy if not exists students_select_all on public.students for select using (true);
create policy if not exists weekly_entries_select_all on public.weekly_entries for select using (true);
create policy if not exists teams_select_all on public.teams for select using (true);
create policy if not exists team_memberships_select_all on public.team_memberships for select using (true);
create policy if not exists team_weekly_entries_select_all on public.team_weekly_entries for select using (true);

-- Write policies (demo). In production, scope to auth.uid() or roles.
create policy if not exists students_write_all on public.students for insert with check (true);
create policy if not exists students_update_all on public.students for update using (true) with check (true);

create policy if not exists weekly_entries_write_all on public.weekly_entries for insert with check (true);
create policy if not exists weekly_entries_update_all on public.weekly_entries for update using (true) with check (true);

create policy if not exists teams_write_all on public.teams for insert with check (true);
create policy if not exists teams_update_all on public.teams for update using (true) with check (true);

create policy if not exists team_memberships_write_all on public.team_memberships for insert with check (true);
create policy if not exists team_memberships_update_all on public.team_memberships for update using (true) with check (true);

create policy if not exists team_weekly_entries_write_all on public.team_weekly_entries for insert with check (true);
create policy if not exists team_weekly_entries_update_all on public.team_weekly_entries for update using (true) with check (true);
```

Security note: The above grants the public anon key insert/update permissions. For production, use Auth and author policies, and consider writing via an edge function with the service role key instead of the browser.

## 3) Configure the app with your Supabase credentials
You can configure Supabase in either of two ways:

- At runtime via the Settings page (stored only in memory for the session)
  - Open the app
  - Go to Settings
  - Enter Supabase URL and anon/public key
  - Click Save Config

- Or define them before the app loads (e.g., in `index.html`):
```html
<!-- Put this before app.js -->
<script>
  window.SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
  window.SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";
</script>
```
The app includes the client via CDN in `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

## 4) Run locally
Serve the files over HTTP (opening from the file:// protocol can break some APIs).

- Python
```bash
cd /workspace
python -m http.server 5173
# open http://localhost:5173
```

- Node
```bash
npm -g i serve
serve -l 5173 .
# open http://localhost:5173
```

## 5) Seed demo data
In the app, go to Settings and click “Initialize Data”. This will upsert demo rows into all five tables. Ensure your RLS policies permit insert/update for the anon key (or configure auth appropriately).

## 6) Use the app
- Dashboard shows current-week status
- Students: filter/search and click a row for details
- Student detail: create/edit weekly entries
  - Week must be a Monday (HK time)
- Teams and Reports
- CSV export buttons generate client-side CSVs using the current in-memory data

## 7) Deploying the SPA
You can deploy to any static hosting provider (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Steps are generally:

1. Upload `index.html`, `style.css`, `app.js` as static assets
2. Provide Supabase URL/key either:
   - by embedding in `index.html` as shown above, or
   - by using the Settings page at runtime

Important: Never embed the service role key in the browser. Use only the anon/public key in the client.

## Troubleshooting
- 401/403 from Supabase:
  - Verify the URL and anon key
  - Check RLS policies; ensure select/insert/update are permitted as needed
- Data not seeding:
  - Check the console for Supabase errors
  - Verify tables exist and column names match the schema above
- CORS or network errors:
  - Serve over HTTP (use a local web server), confirm no ad-blockers are interfering
- Weekly entry save blocked:
  - The app enforces one entry per student per week. Confirm the date is a Monday and uniqueness is respected

## What changed vs the GitHub CSV version
- Storage moved from GitHub contents (CSV) to Supabase tables
- Settings now accept Supabase URL/key
- Initialize Data seeds tables via upserts
- CSV exports remain client-side for convenience

## Security recommendations
- Treat this repo as a demo; for production:
  - Require user auth and scope RLS policies to `auth.uid()`
  - Write via secure endpoints for privileged operations
  - Avoid broad anon write policies