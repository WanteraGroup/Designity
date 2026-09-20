-- DESIGNLY AI Music: final audio is private and served through time-limited signed URLs.
update storage.buckets
set public = false
where id = 'designly-music';

drop policy if exists "Public can read DESIGNLY music files" on storage.objects;

drop policy if exists "Service can manage DESIGNLY music files" on storage.objects;

create policy "Service can manage DESIGNLY music files"
on storage.objects for all
to service_role
using (bucket_id = 'designly-music')
with check (bucket_id = 'designly-music');
