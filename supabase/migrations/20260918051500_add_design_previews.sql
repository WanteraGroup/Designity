create table if not exists public.design_previews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  brief text not null,
  image_url text not null,
  status text not null default 'generated' check (status in ('generated','approved','consumed','expired')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists design_previews_user_status_idx
  on public.design_previews(user_id, status, created_at desc);

alter table public.design_previews enable row level security;

create policy "Users can read their own design previews"
  on public.design_previews for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own design previews"
  on public.design_previews for insert
  to authenticated
  with check (auth.uid() = user_id);
