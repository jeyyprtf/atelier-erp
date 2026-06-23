-- ============================================================================
-- Atelier ERP — Complete Database Schema for Supabase
-- ============================================================================
-- How to use:
--   1. Go to your Supabase project dashboard → SQL Editor
--   2. Paste this ENTIRE file and run it
--   3. Done. All tables, RLS, functions, and triggers are created.
--
-- After running this, create your first C-Level user:
--   Option A: Sign up via the app (will be "member" by default), then manually
--             promote to "c_level" by running the SQL at the bottom of this file.
--   Option B: Use the Supabase dashboard → Authentication → Add User,
--             then run the promotion SQL below.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS (enable if not already on)
-- ============================================================================
-- create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'member' check (role in ('c_level','lead','member')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo','in_progress','approval_pending','done')),
  progress int check (progress between 0 and 100),
  deadline date,
  pic_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_pic_idx on public.tasks(pic_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_created_by_idx on public.tasks(created_by);

-- Task assignees (many-to-many: one task → many members)
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);
create index if not exists task_assignees_profile_idx on public.task_assignees(profile_id);

-- Meetings
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  description text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Resources (shared links/documents)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  category text default 'other',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resources_category_idx on public.resources(category);
create index if not exists resources_created_by_idx on public.resources(created_by);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Current user's role (used inside RLS policies)
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles (id, full_name, email, role, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name',''),
      nullif(new.raw_user_meta_data->>'name',''),
      split_part(new.email,'@',1)
    ),
    new.email,
    'member',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.touch_updated_at();

-- Only C-Level may change a role
create or replace function public.prevent_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(public.my_role(),'') <> 'c_level' then
    raise exception 'Only C-Level can change roles';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.meetings enable row level security;
alter table public.resources enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_clevel on public.profiles;
create policy profiles_update_clevel on public.profiles
  for update to authenticated using (public.my_role() = 'c_level') with check (public.my_role() = 'c_level');

-- ---------- tasks ----------
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select to authenticated using (true);

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (public.my_role() in ('lead','c_level') and created_by = auth.uid());

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update to authenticated using (
    public.my_role() = 'c_level'
    or (public.my_role() = 'lead' and created_by = auth.uid())
    or pic_id = auth.uid()
    or exists (select 1 from public.task_assignees ta where ta.task_id = tasks.id and ta.profile_id = auth.uid())
  );

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete to authenticated using (
    public.my_role() = 'c_level'
    or (public.my_role() = 'lead' and created_by = auth.uid())
  );

-- ---------- task_assignees ----------
drop policy if exists task_assignees_select on public.task_assignees;
create policy task_assignees_select on public.task_assignees
  for select to authenticated using (true);

drop policy if exists task_assignees_write on public.task_assignees;
create policy task_assignees_write on public.task_assignees
  for all to authenticated using (
    public.my_role() = 'c_level'
    or (public.my_role() = 'lead' and exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid()))
  ) with check (
    public.my_role() = 'c_level'
    or (public.my_role() = 'lead' and exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid()))
  );

-- ---------- meetings ----------
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings
  for select to authenticated using (true);

drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings
  for update to authenticated
  using (created_by = auth.uid() or public.my_role() = 'c_level')
  with check (created_by = auth.uid() or public.my_role() = 'c_level');

drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings
  for delete to authenticated using (created_by = auth.uid() or public.my_role() = 'c_level');

-- ---------- resources ----------
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select to authenticated using (true);

drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists resources_update on public.resources;
create policy resources_update on public.resources
  for update to authenticated using (true) with check (true);

drop policy if exists resources_delete on public.resources;
create policy resources_delete on public.resources
  for delete to authenticated using (created_by = auth.uid() or public.my_role() = 'c_level');

-- ============================================================================
-- SECURITY HARDENING
-- ============================================================================

-- Trigger functions never need direct RPC access
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_change() from public, anon, authenticated;

-- my_role() only used inside RLS for authenticated users
revoke all on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- ============================================================================
-- REALTIME (live updates across users)
-- ============================================================================

begin;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.task_assignees;
exception when duplicate_object then null;
commit;

-- ============================================================================
-- AVATAR STORAGE (for profile photo upload)
-- ============================================================================
-- Run in SQL Editor to create the public avatars bucket:

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, '{image/webp,image/jpeg,image/png}')
on conflict (id) do update set public=true, file_size_limit=1048576, allowed_mime_types='{image/webp,image/jpeg,image/png}';

drop policy if exists avatar_insert on storage.objects;
create policy avatar_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_select on storage.objects;

drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- TASK COMMENTS, NOTIFICATIONS & TIME TRACKING
-- ============================================================================

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx on public.task_comments(task_id);

alter table public.task_comments enable row level security;
drop policy if exists tc_select on public.task_comments;
create policy tc_select on public.task_comments for select to authenticated using (true);
drop policy if exists tc_insert on public.task_comments;
create policy tc_insert on public.task_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists tc_delete on public.task_comments;
create policy tc_delete on public.task_comments for delete to authenticated using (author_id = auth.uid() or public.my_role() = 'c_level');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_profile_idx on public.notifications(profile_id);

alter table public.notifications enable row level security;
drop policy if exists notif_self on public.notifications;
create policy notif_self on public.notifications for select to authenticated using (profile_id = auth.uid());
drop policy if exists notif_mark on public.notifications;
create policy notif_mark on public.notifications for update to authenticated using (profile_id = auth.uid());

-- triggers for auto-notifications on status change
create or replace function public.notify_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (profile_id, kind, body, link)
    select uid, 'status_change', format('%s moved "%s" to %s', p.full_name, new.title, new.status), '/team'
    from (
      select new.pic_id as uid where new.pic_id is not null
      union
      select ta.profile_id from public.task_assignees ta where ta.task_id = new.id
    ) u
    join public.profiles p on p.id = auth.uid()
    where u.uid is not null and u.uid <> auth.uid();
  end if;
  return new;
end; $$;

drop trigger if exists task_notify on public.tasks;
create trigger task_notify after update on public.tasks
  for each row execute function public.notify_status_change();

-- trigger: notify on new comment
create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  title_ text; uid_ uuid;
begin
  select t.title, t.pic_id into title_, uid_ from public.tasks t where t.id = new.task_id;
  if uid_ is not null and uid_ <> new.author_id then
    insert into public.notifications (profile_id, kind, body, link)
    values (uid_, 'comment', format('%s commented on "%s"', (select full_name from public.profiles where id = new.author_id), title_), '/team');
  end if;
  return new;
end; $$;

drop trigger if exists comment_notify on public.task_comments;
create trigger comment_notify after insert on public.task_comments
  for each row execute function public.notify_comment();

-- trigger: notify on new assignment
create or replace function public.notify_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  title_ text;
begin
  select t.title into title_ from public.tasks t where t.id = new.task_id;
  if not exists (select 1 from public.notifications where profile_id = new.profile_id and kind = 'assigned' and created_at > now() - interval '60 seconds' and body like '%' || title_ || '%') then
    insert into public.notifications (profile_id, kind, body, link)
    values (new.profile_id, 'assigned', format('You were assigned to "%s"', title_), '/team');
  end if;
  return new;
end; $$;

drop trigger if exists assign_notify on public.task_assignees;
create trigger assign_notify after insert on public.task_assignees
  for each row execute function public.notify_assignment();

-- time tracking
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  minutes int not null check (minutes > 0 and minutes <= 1440),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists time_entries_task_idx on public.time_entries(task_id);

alter table public.time_entries enable row level security;
drop policy if exists te_select on public.time_entries;
create policy te_select on public.time_entries for select to authenticated using (true);
drop policy if exists te_insert on public.time_entries;
create policy te_insert on public.time_entries for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists te_delete on public.time_entries;
create policy te_delete on public.time_entries for delete to authenticated using (profile_id = auth.uid() or public.my_role() = 'c_level');

-- ============================================================================
-- OPTIONAL: Promote first user to C-Level
-- ============================================================================
-- Run this after the first user signs up:
--
--   update public.profiles set role = 'c_level' where email = 'you@example.com';
--
-- Or promote via Supabase dashboard: Table Editor → profiles → edit the row.
-- ============================================================================
