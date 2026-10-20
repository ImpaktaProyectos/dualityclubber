ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS maintenance_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_title text DEFAULT 'Estamos ajustando el sonido',
  ADD COLUMN IF NOT EXISTS maintenance_message text DEFAULT 'Volvemos en unos minutos. Gracias por tu paciencia.';