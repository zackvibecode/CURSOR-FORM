-- Scope form-images uploads to the authenticated user's folder: {user_id}/filename

DROP POLICY IF EXISTS "Authenticated upload form images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update form images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete form images" ON storage.objects;

CREATE POLICY "Users upload own form images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own form images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own form images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
