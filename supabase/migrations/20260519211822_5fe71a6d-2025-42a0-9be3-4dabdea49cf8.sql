ALTER TABLE public.visual_settings
  ADD COLUMN IF NOT EXISTS background_scroll_mode text NOT NULL DEFAULT 'continuous';