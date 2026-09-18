-- Store final DESIGNLY AI renders in a public bucket so generated designs can be viewed in the app.
insert into storage.buckets (id, name, public)
values ('designly-generations', 'designly-generations', true)
on conflict (id) do update set public = true;
