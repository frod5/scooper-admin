-- Scooper schema
-- App timezone: Asia/Seoul (date/time values are stored without TZ; timestamptz is UTC)

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('system_admin', 'owner', 'employee');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_status as enum ('active', 'resigned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum (
    'change_request',
    'change_approved',
    'change_rejected',
    'notice',
    'owner_request'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'notification_type'
      and e.enumlabel = 'owner_request'
  ) then
    alter type public.notification_type add value 'owner_request';
  end if;
end $$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  name text not null,
  role public.user_role not null,
  status public.user_status not null default 'active',
  branch_id uuid references public.branches (id),
  constraint profiles_branch_by_role check (
    (role = 'employee' and branch_id is not null)
    or (role in ('system_admin', 'owner') and branch_id is null)
  )
);

create table if not exists public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  start_time time not null default '11:00',
  end_time time not null default '21:00',
  unique (user_id, work_date)
);

create table if not exists public.schedule_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  requested_start time not null,
  requested_end time not null,
  reason text,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles (id)
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id),
  branch_id uuid references public.branches (id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  url text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id),
  memo_date date not null,
  body text not null,
  created_at timestamptz not null default now()
);

comment on column public.inventory_memos.body is
  'JSON array of { "label": "레몬", "qty": 3 }';

create table if not exists public.owner_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_branch_id_idx on public.profiles (branch_id);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists work_schedules_work_date_idx on public.work_schedules (work_date);
create index if not exists work_schedules_user_id_idx on public.work_schedules (user_id);
create index if not exists schedule_change_requests_status_idx on public.schedule_change_requests (status);
create index if not exists notices_created_at_idx on public.notices (created_at desc);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
drop index if exists public.notifications_user_created_at_idx;
drop index if exists public.notifications_user_unread_idx;
drop index if exists public.notifications_user_id_created_at_idx;
drop index if exists public.notifications_user_id_unread_idx;
create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index if not exists inventory_memos_memo_date_idx
  on public.inventory_memos (memo_date);
create index if not exists inventory_memos_branch_date_idx
  on public.inventory_memos (branch_id, memo_date desc);
create index if not exists owner_requests_created_at_idx
  on public.owner_requests (created_at desc);

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid()
$$;

create or replace function public.current_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('system_admin', 'owner')
      and status = 'active'
  )
$$;

create or replace function public.is_active_self()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  )
$$;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.branch_id is distinct from old.branch_id
     or new.id is distinct from old.id then
    raise exception 'not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
before update on public.profiles
for each row
execute procedure public.protect_profile_columns();

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.work_schedules enable row level security;
alter table public.schedule_change_requests enable row level security;
alter table public.notices enable row level security;
alter table public.support_tickets enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.inventory_memos enable row level security;
alter table public.owner_requests enable row level security;

drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select to authenticated
  using (public.is_active_self() and (public.is_staff() or id = public.current_branch_id()));

drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    public.is_active_self()
    and (
      public.is_staff()
      or id = auth.uid()
      or (
        public.current_role() = 'employee'
        and branch_id = public.current_branch_id()
        and status = 'active'
      )
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_staff() or id = auth.uid())
  with check (public.is_staff() or id = auth.uid());

drop policy if exists work_schedules_select on public.work_schedules;
create policy work_schedules_select on public.work_schedules
  for select to authenticated
  using (
    public.is_active_self()
    and (
      public.is_staff()
      or exists (
        select 1
        from public.profiles p
        where p.id = work_schedules.user_id
          and p.branch_id = public.current_branch_id()
          and p.status = 'active'
      )
    )
  );

drop policy if exists work_schedules_write on public.work_schedules;
create policy work_schedules_write on public.work_schedules
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists schedule_change_requests_select on public.schedule_change_requests;
create policy schedule_change_requests_select on public.schedule_change_requests
  for select to authenticated
  using (public.is_staff() or user_id = auth.uid());

drop policy if exists schedule_change_requests_insert on public.schedule_change_requests;
create policy schedule_change_requests_insert on public.schedule_change_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and public.current_role() = 'employee'
    and public.current_status() = 'active'
  );

drop policy if exists schedule_change_requests_update on public.schedule_change_requests;
create policy schedule_change_requests_update on public.schedule_change_requests
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists schedule_change_requests_delete on public.schedule_change_requests;
create policy schedule_change_requests_delete on public.schedule_change_requests
  for delete to authenticated
  using (
    public.is_staff()
    or (
      user_id = auth.uid()
      and status = 'pending'
      and public.current_role() = 'employee'
      and public.current_status() = 'active'
    )
  );

drop policy if exists notices_select on public.notices;
create policy notices_select on public.notices
  for select to authenticated
  using (
    public.is_staff()
    or (
      public.current_status() = 'active'
      and (branch_id is null or branch_id = public.current_branch_id())
    )
  );

drop policy if exists notices_insert on public.notices;
create policy notices_insert on public.notices
  for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());

drop policy if exists support_tickets_select on public.support_tickets;
create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (
    public.current_role() = 'system_admin'
    or user_id = auth.uid()
  );

drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_status() = 'active'
    and public.current_role() in ('employee', 'owner')
  );

drop policy if exists push_subscriptions_select on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subscriptions_insert on public.push_subscriptions;
create policy push_subscriptions_insert on public.push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_subscriptions_update on public.push_subscriptions;
create policy push_subscriptions_update on public.push_subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_delete on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid() and public.is_active_self());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid() and public.is_active_self())
  with check (user_id = auth.uid() and public.is_active_self());

drop policy if exists inventory_memos_select on public.inventory_memos;
create policy inventory_memos_select on public.inventory_memos
  for select to authenticated
  using (
    public.is_active_self()
    and (
      public.is_staff()
      or branch_id = public.current_branch_id()
    )
  );

drop policy if exists inventory_memos_insert on public.inventory_memos;
create policy inventory_memos_insert on public.inventory_memos
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_role() = 'employee'
    and public.current_status() = 'active'
    and branch_id = public.current_branch_id()
  );

drop policy if exists inventory_memos_update on public.inventory_memos;
create policy inventory_memos_update on public.inventory_memos
  for update to authenticated
  using (
    public.is_active_self()
    and (
      public.is_staff()
      or (
        public.current_role() = 'employee'
        and branch_id = public.current_branch_id()
      )
    )
  )
  with check (
    public.is_active_self()
    and (
      public.is_staff()
      or (
        public.current_role() = 'employee'
        and branch_id = public.current_branch_id()
      )
    )
  );

drop policy if exists inventory_memos_delete on public.inventory_memos;
create policy inventory_memos_delete on public.inventory_memos
  for delete to authenticated
  using (
    public.is_active_self()
    and (
      public.is_staff()
      or (
        public.current_role() = 'employee'
        and branch_id = public.current_branch_id()
      )
    )
  );

drop policy if exists owner_requests_select on public.owner_requests;
create policy owner_requests_select on public.owner_requests
  for select to authenticated
  using (public.is_staff() or user_id = auth.uid());

drop policy if exists owner_requests_insert on public.owner_requests;
create policy owner_requests_insert on public.owner_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_role() = 'employee'
    and public.current_status() = 'active'
  );

revoke all on public.branches from anon, public;
revoke all on public.profiles from anon, public;
revoke all on public.work_schedules from anon, public;
revoke all on public.schedule_change_requests from anon, public;
revoke all on public.notices from anon, public;
revoke all on public.support_tickets from anon, public;
revoke all on public.push_subscriptions from anon, public;
revoke all on public.notifications from anon, public;
revoke all on public.inventory_memos from anon, public;
revoke all on public.owner_requests from anon, public;

grant select, insert, update, delete on public.branches to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.work_schedules to authenticated;
grant select, insert, update, delete on public.schedule_change_requests to authenticated;
grant select, insert, update, delete on public.notices to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.inventory_memos to authenticated;
grant select, insert, update, delete on public.owner_requests to authenticated;

revoke all on function public.current_role() from public, anon;
revoke all on function public.current_status() from public, anon;
revoke all on function public.current_branch_id() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_active_self() from public, anon;

grant execute on function public.current_role() to authenticated;
grant execute on function public.current_status() to authenticated;
grant execute on function public.current_branch_id() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_active_self() to authenticated;
