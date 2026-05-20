ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ticket_mode text NOT NULL DEFAULT 'iframe',
  ADD COLUMN IF NOT EXISTS countdown_subtitle text DEFAULT 'Cada segundo te acerca a la noche.',
  ADD COLUMN IF NOT EXISTS font_button text;

ALTER TABLE public.visual_settings
  ADD COLUMN IF NOT EXISTS background_scroll_behavior text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS background_scroll_intensity integer NOT NULL DEFAULT 30;

ALTER TABLE public.section_backgrounds
  ADD COLUMN IF NOT EXISTS background_scroll_behavior text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS background_scroll_intensity integer DEFAULT 30;