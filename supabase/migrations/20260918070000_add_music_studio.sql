-- DESIGNLY AI Music Studio
-- Stores generated audio metadata and creates a public download bucket.
insert into storage.buckets (id, name, public)
values ('designly-music', 'designly-music', true)
on conflict (id) do update set public = true;

create table if not exists public.music_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  lyrics text not null,
  genre text,
  mood text,
  vocal text,
  duration_seconds integer not null,
  credits_cost integer not null,
  audio_url text not null,
  storage_path text not null,
  provider text not null default 'minimax/music-3',
  seed integer,
  created_at timestamptz not null default now()
);

alter table public.music_generations enable row level security;

drop policy if exists "Users can read own music generations" on public.music_generations;
create policy "Users can read own music generations"
on public.music_generations for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own music generations" on public.music_generations;
create policy "Users can insert own music generations"
on public.music_generations for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own music generations" on public.music_generations;
create policy "Users can delete own music generations"
on public.music_generations for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Public can read DESIGNLY music files" on storage.objects;
create policy "Public can read DESIGNLY music files"
on storage.objects for select
to public
using (bucket_id = 'designly-music');

drop policy if exists "Service can manage DESIGNLY music files" on storage.objects;
create policy "Service can manage DESIGNLY music files"
on storage.objects for all
to service_role
using (bucket_id = 'designly-music')
with check (bucket_id = 'designly-music');
