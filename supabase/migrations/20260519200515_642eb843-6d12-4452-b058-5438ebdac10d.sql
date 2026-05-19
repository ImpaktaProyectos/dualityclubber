
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_event_key TEXT NOT NULL DEFAULT 'aqua-open-air-2026',
  event_name TEXT NOT NULL DEFAULT 'AQUA OPEN AIR',
  event_subtitle TEXT DEFAULT 'Summer Edition',
  event_date TEXT DEFAULT 'Sábado 18 julio',
  opening_time TEXT DEFAULT '22:00',
  venue_name TEXT DEFAULT 'KM Cero',
  venue_location TEXT DEFAULT 'Ledaña',
  primary_color TEXT DEFAULT '#00AEEF',
  secondary_color TEXT DEFAULT '#FF1E2D',
  glow_color TEXT DEFAULT 'rgba(0,174,239,0.65)',
  background_color TEXT DEFAULT '#03060B',
  hero_video_desktop_url TEXT,
  hero_video_mobile_url TEXT,
  hero_image_desktop_url TEXT,
  hero_image_mobile_url TEXT,
  hero_title TEXT DEFAULT 'AQUA OPEN AIR',
  hero_subtitle TEXT DEFAULT 'Summer Edition',
  hero_cta_primary_text TEXT DEFAULT 'Comprar entradas',
  hero_cta_primary_url TEXT DEFAULT '#entradas',
  hero_cta_secondary_text TEXT DEFAULT 'Ver artistas',
  hero_cta_secondary_url TEXT DEFAULT '#artistas',
  ticket_iframe_url TEXT,
  ticket_fallback_url TEXT,
  ticket_status TEXT DEFAULT 'available',
  ticket_title TEXT DEFAULT 'Compra tus entradas',
  ticket_text TEXT DEFAULT 'Venta oficial mediante Fourvenues.',
  ticket_trust_text TEXT DEFAULT 'Compra segura · Entrada digital · Acceso oficial',
  ticket_show_fallback BOOLEAN DEFAULT TRUE,
  countdown_enabled BOOLEAN DEFAULT TRUE,
  countdown_datetime TIMESTAMPTZ,
  countdown_title TEXT DEFAULT 'La cuenta atrás ha empezado',
  countdown_subtext TEXT DEFAULT 'Asegura tu entrada antes de que se agoten.',
  countdown_cta_text TEXT DEFAULT 'Comprar ahora',
  countdown_cta_url TEXT DEFAULT '#entradas',
  location_name TEXT DEFAULT 'KM Cero',
  location_address TEXT DEFAULT 'Ledaña, Cuenca',
  location_city TEXT DEFAULT 'Ledaña',
  location_maps_url TEXT DEFAULT 'https://maps.google.com/?q=Ledaña',
  location_embed_url TEXT,
  location_parking_text TEXT DEFAULT 'Parking gratuito en el recinto.',
  location_access_text TEXT DEFAULT 'Acceso peatonal por la entrada principal.',
  location_button_text TEXT DEFAULT 'Cómo llegar',
  authorization_title TEXT DEFAULT 'Autorización para menores',
  authorization_description TEXT DEFAULT 'Descarga, rellena y entrega la autorización en el acceso.',
  authorization_pdf_url TEXT,
  authorization_button_text TEXT DEFAULT 'Descargar PDF',
  final_cta_title TEXT DEFAULT 'Vive tu dualidad',
  final_cta_text TEXT DEFAULT 'Una noche. Dos energías. Un mismo destino.',
  final_cta_button_text TEXT DEFAULT 'Comprar entradas',
  final_cta_button_url TEXT DEFAULT '#entradas',
  final_cta_background_url TEXT,
  footer_logo_url TEXT,
  footer_instagram_url TEXT DEFAULT 'https://instagram.com',
  footer_tiktok_url TEXT DEFAULT 'https://tiktok.com',
  footer_facebook_url TEXT,
  footer_email TEXT DEFAULT 'info@duality.events',
  footer_legal_url TEXT DEFAULT '#',
  footer_privacy_url TEXT DEFAULT '#',
  footer_cookies_url TEXT DEFAULT '#',
  footer_copyright TEXT DEFAULT '© DUALITY Events',
  appearance_preset TEXT DEFAULT 'aqua',
  appearance_glow_intensity INTEGER DEFAULT 65,
  appearance_particles BOOLEAN DEFAULT TRUE,
  appearance_texture BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_singleton BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (is_singleton)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "site_settings admin write" ON public.site_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_mode TEXT NOT NULL DEFAULT 'visible',
  sort_order INTEGER NOT NULL DEFAULT 0,
  admin_status TEXT NOT NULL DEFAULT 'complete',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER page_sections_touch BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "page_sections public read" ON public.page_sections FOR SELECT USING (TRUE);
CREATE POLICY "page_sections admin write" ON public.page_sections FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quick_info_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT,
  icon TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quick_info_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER quick_info_touch BEFORE UPDATE ON public.quick_info_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "quick_info public read" ON public.quick_info_items FOR SELECT USING (TRUE);
CREATE POLICY "quick_info admin write" ON public.quick_info_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  stage TEXT,
  performance_time TEXT,
  instagram_url TEXT,
  music_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER artists_touch BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "artists public read" ON public.artists FOR SELECT USING (TRUE);
CREATE POLICY "artists admin write" ON public.artists FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  custom_artist_name TEXT,
  start_time TEXT,
  end_time TEXT,
  description TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER schedule_touch BEFORE UPDATE ON public.schedule_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "schedule public read" ON public.schedule_items FOR SELECT USING (TRUE);
CREATE POLICY "schedule admin write" ON public.schedule_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  title TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER gallery_touch BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "gallery public read" ON public.gallery_items FOR SELECT USING (TRUE);
CREATE POLICY "gallery admin write" ON public.gallery_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town TEXT NOT NULL,
  departure_point TEXT,
  departure_time TEXT,
  return_time TEXT,
  price TEXT,
  booking_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bus_routes_touch BEFORE UPDATE ON public.bus_routes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "bus_routes public read" ON public.bus_routes FOR SELECT USING (TRUE);
CREATE POLICY "bus_routes admin write" ON public.bus_routes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER faqs_touch BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT USING (TRUE);
CREATE POLICY "faqs admin write" ON public.faqs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES
  ('hero-media', 'hero-media', TRUE),
  ('artist-images', 'artist-images', TRUE),
  ('gallery', 'gallery', TRUE),
  ('authorization-pdfs', 'authorization-pdfs', TRUE),
  ('general-assets', 'general-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "duality buckets public read" ON storage.objects FOR SELECT USING (
  bucket_id IN ('hero-media','artist-images','gallery','authorization-pdfs','general-assets')
);
CREATE POLICY "duality buckets admin write" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id IN ('hero-media','artist-images','gallery','authorization-pdfs','general-assets')
  AND public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  bucket_id IN ('hero-media','artist-images','gallery','authorization-pdfs','general-assets')
  AND public.has_role(auth.uid(), 'admin')
);

INSERT INTO public.site_settings (countdown_datetime) VALUES (now() + INTERVAL '45 days');

INSERT INTO public.page_sections (section_key, section_name, is_enabled, display_mode, sort_order) VALUES
  ('hero','Hero',TRUE,'visible',10),
  ('quick_info','Información rápida',TRUE,'visible',20),
  ('countdown','Cuenta atrás',TRUE,'visible',30),
  ('tickets','Entradas',TRUE,'visible',40),
  ('artists','Artistas',TRUE,'visible',50),
  ('schedule','Horarios',TRUE,'visible',60),
  ('gallery','Galería',TRUE,'visible',70),
  ('location','Ubicación',TRUE,'visible',80),
  ('buses','Buses',FALSE,'hidden',90),
  ('authorization','Autorización',FALSE,'hidden',100),
  ('faq','FAQ',TRUE,'visible',110),
  ('final_cta','CTA final',TRUE,'visible',120),
  ('footer','Footer',TRUE,'visible',130);

INSERT INTO public.quick_info_items (label, sort_order) VALUES
  ('18 JULIO',1),('22:00H',2),('KM CERO LEDAÑA',3),('3 ÁREAS',4),('PISCINA EXTERIOR',5),('FOODTRUCK',6);

INSERT INTO public.artists (name, stage, performance_time, is_featured, sort_order) VALUES
  ('NOVA TWIN','Open Air','02:00', TRUE, 1),
  ('KAIRO','Main Room','01:00', TRUE, 2),
  ('LUNA REIGN','Area Club','03:30', FALSE, 3),
  ('SYREN','Open Air','00:00', FALSE, 4),
  ('VEKTOR','Main Room','04:00', TRUE, 5),
  ('OBSIDIAN','Area Club','05:00', FALSE, 6);

INSERT INTO public.schedule_items (stage, custom_artist_name, start_time, end_time, sort_order) VALUES
  ('Open Air','SYREN','00:00','02:00',1),
  ('Open Air','NOVA TWIN','02:00','04:00',2),
  ('Main Room','KAIRO','01:00','04:00',3),
  ('Main Room','VEKTOR','04:00','06:00',4),
  ('Area Club','LUNA REIGN','03:30','05:00',5),
  ('Area Club','OBSIDIAN','05:00','07:00',6);

INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('¿Dónde puedo comprar las entradas?','Las entradas oficiales se compran desde esta misma web a través del módulo de Fourvenues.',1),
  ('¿Dónde se celebra el evento?','En KM Cero, Ledaña. Tienes el mapa y el botón "Cómo llegar" en la sección Ubicación.',2),
  ('¿A qué hora empieza?','La apertura de puertas es a las 22:00.',3),
  ('¿Puedo entrar si soy menor de edad?','Solo con autorización firmada por padre/madre/tutor y DNI original.',4),
  ('¿Habrá buses?','Publicaremos las rutas y horarios disponibles en la sección Buses cuando estén confirmadas.',5),
  ('¿Puedo salir y volver a entrar?','Se permite reentrada con sellado de pulsera hasta la hora indicada en el acceso.',6);
