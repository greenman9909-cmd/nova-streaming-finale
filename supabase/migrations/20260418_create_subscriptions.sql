create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_id text not null default 'basic',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_stripe_sub_idx on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can read their subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role can do everything (used by webhook)
create policy "Service role full access"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Auto-update updated_at
create or replace function public.handle_subscription_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_subscription_updated
  before update on public.subscriptions
  for each row execute procedure public.handle_subscription_updated_at();
