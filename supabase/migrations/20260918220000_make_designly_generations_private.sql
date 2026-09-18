-- Make DESIGNLY generated images private.
-- Browsers must receive time-limited signed URLs instead of public object URLs.
update storage.buckets
set public = false
where id = 'designly-generations';
