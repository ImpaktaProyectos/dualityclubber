-- Tabla singleton de configuración visual global
CREATE TABLE IF NOT EXISTS public.visual_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton boolean NOT NULL DEFAULT true UNIQUE,
  background_type text NOT NULL DEFAULT 'solid', -- solid|gradient|image|video|pattern
  background_color text DEFAULT '#03060B',
  background_secondary_color text DEFAULT '#0a1a2e',
  background_image_url text,
  background_video_url text,
  background_position text DEFAULT 'center',
  background_size text DEFAULT 'cover',
  background_repeat boolean DEFAULT false,
  background_fixed boolean DEFAULT false,
  image_opacity integer DEFAULT 60,
  overlay_color text DEFAULT '#000000',
  overlay_opacity integer DEFAULT 55,
  blur_amount integer DEFAULT 0,
  saturation integer DEFAULT 100,
  contrast integer DEFAULT 100,
  glow_intensity text DEFAULT 'medium', -- off|low|medium|high
  texture_type text DEFAULT 'none', -- none|noise|grid|scanlines|vignette|dual-split|radial|light-beams
  texture_opacity integer DEFAULT 25,
  motion_type text DEFAULT 'none', -- none|particles|pulse-glow|gradient-shift|light-sweep
  motion_enabled boolean DEFAULT false,
  motion_speed text DEFAULT 'medium', -- slow|medium|fast
  atmosphere_preset text DEFAULT 'aqua',
  readability_mode text DEFAULT 'medium', -- low|medium|high
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visual_settings public read" ON public.visual_settings FOR SELECT USING (true);
CREATE POLICY "visual_settings admin write" ON public.visual_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER visual_settings_touch BEFORE UPDATE ON public.visual_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.visual_settings (is_singleton) VALUES (true) ON CONFLICT DO NOTHING;

-- Tabla de fondos por sección
CREATE TABLE IF NOT EXISTS public.section_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  use_global_background boolean NOT NULL DEFAULT true,
  background_type text DEFAULT 'solid',
  background_color text,
  background_secondary_color text,
  background_image_url text,
  background_video_url text,
  background_position text DEFAULT 'center',
  background_size text DEFAULT 'cover',
  image_opacity integer DEFAULT 60,
  overlay_color text DEFAULT '#000000',
  overlay_opacity integer DEFAULT 55,
  blur_amount integer DEFAULT 0,
  texture_type text DEFAULT 'none',
  texture_opacity integer DEFAULT 25,
  motion_type text DEFAULT 'none',
  motion_enabled boolean DEFAULT false,
  motion_speed text DEFAULT 'medium',
  glow_intensity text DEFAULT 'medium',
  readability_mode text DEFAULT 'medium',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_backgrounds public read" ON public.section_backgrounds FOR SELECT USING (true);
CREATE POLICY "section_backgrounds admin write" ON public.section_backgrounds FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER section_backgrounds_touch BEFORE UPDATE ON public.section_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed por sección
INSERT INTO public.section_backgrounds (section_key) VALUES
  ('hero'),('quick_info'),('countdown'),('tickets'),('artists'),('schedule'),
  ('gallery'),('location'),('buses'),('authorization'),('faq'),('final_cta'),('footer')
ON CONFLICT (section_key) DO NOTHING;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('background-images','background-images', true),
  ('background-videos','background-videos', true),
  ('textures','textures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (públicas lectura, admin escritura)
CREATE POLICY "bg images public read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('background-images','background-videos','textures'));

CREATE POLICY "bg images admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('background-images','background-videos','textures') AND has_role(auth.uid(),'admin'));

CREATE POLICY "bg images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('background-images','background-videos','textures') AND has_role(auth.uid(),'admin'));

CREATE POLICY "bg images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('background-images','background-videos','textures') AND has_role(auth.uid(),'admin'));