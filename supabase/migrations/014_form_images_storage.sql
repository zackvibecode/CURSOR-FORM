-- Storage bucket for form display images (owner-uploaded banners / package images)
-- Run this in the Supabase SQL Editor.

-- 1. Create a public bucket for form images
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-images', 'form-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Anyone can read (public form images need to render for anonymous visitors)
CREATE POLICY "Public read for form images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'form-images');

-- 3. Authenticated users can upload
CREATE POLICY "Authenticated upload form images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'form-images');

-- 4. Authenticated users can update their uploads
CREATE POLICY "Authenticated update form images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'form-images');

-- 5. Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete form images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'form-images');