create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  image text,
  icon text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert their notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
