
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS header_logo_url text,
  ADD COLUMN IF NOT EXISTS header_logo_height integer DEFAULT 36,
  ADD COLUMN IF NOT EXISTS font_display text DEFAULT 'Space Grotesk',
  ADD COLUMN IF NOT EXISTS font_body text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS footer_twitter_url text,
  ADD COLUMN IF NOT EXISTS footer_youtube_url text,
  ADD COLUMN IF NOT EXISTS footer_spotify_url text,
  ADD COLUMN IF NOT EXISTS footer_soundcloud_url text,
  ADD COLUMN IF NOT EXISTS footer_whatsapp_url text,
  ADD COLUMN IF NOT EXISTS footer_telegram_url text,
  ADD COLUMN IF NOT EXISTS footer_x_url text;
