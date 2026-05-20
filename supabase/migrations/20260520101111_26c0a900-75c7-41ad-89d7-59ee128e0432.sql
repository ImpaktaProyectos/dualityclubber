-- Phase 1: Stages, branding, sections lock, FK relations

-- 1) stages table
CREATE TABLE IF NOT EXISTS public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages public read" ON public.stages
  FOR SELECT TO public USING (true);

CREATE POLICY "stages admin write" ON public.stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER stages_touch_updated_at
  BEFORE UPDATE ON public.stages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Seed default stages
INSERT INTO public.stages (name, slug, color, sort_order) VALUES
  ('Open Air', 'open-air', '#00AEEF', 0),
  ('Main Room', 'main-room', '#FF1E2D', 1),
  ('Area Club', 'area-club', '#A855F7', 2)
ON CONFLICT (slug) DO NOTHING;

-- 3) artists.stage_id
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL;

-- 4) schedule_items.stage_id
ALTER TABLE public.schedule_items
  ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL;

-- 5) Backfill stage_id by normalized name match
UPDATE public.artists a
SET stage_id = s.id
FROM public.stages s
WHERE a.stage_id IS NULL
  AND a.stage IS NOT NULL
  AND lower(regexp_replace(trim(a.stage), '\s+', '-', 'g')) = s.slug;

UPDATE public.schedule_items si
SET stage_id = s.id
FROM public.stages s
WHERE si.stage_id IS NULL
  AND si.stage IS NOT NULL
  AND lower(regexp_replace(trim(si.stage), '\s+', '-', 'g')) = s.slug;

-- 6) page_sections.is_locked
ALTER TABLE public.page_sections
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

UPDATE public.page_sections
SET is_locked = true
WHERE section_key IN ('header', 'footer', 'hero');

-- 7) site_settings brand logos
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand_logo_main_url text,
  ADD COLUMN IF NOT EXISTS brand_logo_light_url text,
  ADD COLUMN IF NOT EXISTS brand_logo_dark_url text,
  ADD COLUMN IF NOT EXISTS brand_icon_url text,
  ADD COLUMN IF NOT EXISTS brand_favicon_url text;
