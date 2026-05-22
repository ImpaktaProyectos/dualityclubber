-- Remove broad SELECT policies on storage.objects to prevent file listing.
-- Public buckets still serve files via public CDN URLs without requiring SELECT on storage.objects.
DROP POLICY IF EXISTS "bg images public read" ON storage.objects;
DROP POLICY IF EXISTS "duality buckets public read" ON storage.objects;
DROP POLICY IF EXISTS "shop-products public read" ON storage.objects;