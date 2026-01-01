-- Create storage bucket for spec sheets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spec-sheets',
  'spec-sheets',
  false,
  10485760,
  '{"application/pdf"}'
);

-- Storage RLS policies

-- Authenticated users can view/download files
CREATE POLICY "Authenticated users can view spec sheets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'spec-sheets');

-- Only admins can upload files
CREATE POLICY "Admins can upload spec sheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'spec-sheets' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete files
CREATE POLICY "Admins can delete spec sheets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'spec-sheets' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);
