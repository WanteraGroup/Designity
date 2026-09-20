-- DESIGNLY profile extensions: phone + public avatar storage.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'designly-avatars',
  'designly-avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS "designly_avatar_insert_own" ON storage.objects;
CREATE POLICY "designly_avatar_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designly-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "designly_avatar_update_own" ON storage.objects;
CREATE POLICY "designly_avatar_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'designly-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'designly-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "designly_avatar_delete_own" ON storage.objects;
CREATE POLICY "designly_avatar_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'designly-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
