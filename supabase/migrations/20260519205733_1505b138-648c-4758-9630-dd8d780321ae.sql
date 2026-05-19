ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_flyer_url text,
  ADD COLUMN IF NOT EXISTS hero_flyer_enabled boolean DEFAULT false;