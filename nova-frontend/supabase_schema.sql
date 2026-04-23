-- Supabase schema for Nova
-- Run in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  is_kid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id text not null,
  media_type text not null,
  title text not null,
  category text,
  image text,
  added_at timestamptz not null default now(),
  unique (user_id, media_id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.watch_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id text not null,
  media_type text not null,
  title text,
  image text,
  progress integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, media_id)
);

alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.user_settings enable row level security;
alter table public.watch_history enable row level security;

create policy "profiles_select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = user_id);
create policy "profiles_delete" on public.profiles
  for delete using (auth.uid() = user_id);

create policy "watchlist_select" on public.watchlist
  for select using (auth.uid() = user_id);
create policy "watchlist_insert" on public.watchlist
  for insert with check (auth.uid() = user_id);
create policy "watchlist_update" on public.watchlist
  for update using (auth.uid() = user_id);
create policy "watchlist_delete" on public.watchlist
  for delete using (auth.uid() = user_id);

create policy "settings_select" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "settings_upsert" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "settings_update" on public.user_settings
  for update using (auth.uid() = user_id);

create policy "history_select" on public.watch_history
  for select using (auth.uid() = user_id);
create policy "history_upsert" on public.watch_history
  for insert with check (auth.uid() = user_id);
create policy "history_update" on public.watch_history
  for update using (auth.uid() = user_id);
create policy "history_delete" on public.watch_history
  for delete using (auth.uid() = user_id);