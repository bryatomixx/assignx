-- 0006_events.sql
--
-- Events shown in the sidebar "Upcoming Events" widget and managed from the
-- admin events editor (/admin/events). Admins create/edit/delete; everyone
-- authenticated can read.

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  link          text,
  timezone      text not null default 'EST',
  start_time    text not null default '12:00',                 -- "HH:MM" (24h)
  recurrence    text not null default 'once'
                  check (recurrence in ('once', 'weekly', 'monthly')),
  event_date    date,                                          -- recurrence = 'once'
  day_of_week   integer check (day_of_week between 0 and 6),   -- 'weekly' (0 = Sun)
  day_of_month  integer check (day_of_month between 1 and 31), -- 'monthly'
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_events_recurrence on public.events(recurrence);

alter table public.events enable row level security;

-- Any authenticated user can read events (for the sidebar widget).
create policy "events_select" on public.events
  for select to authenticated using (true);

-- Only admins can create / update / delete.
create policy "events_insert_admin" on public.events
  for insert to authenticated with check (public.is_admin());
create policy "events_update_admin" on public.events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "events_delete_admin" on public.events
  for delete to authenticated using (public.is_admin());
