
-- Shop products table
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price text,
  image_url text,
  whatsapp_message text,
  button_text text DEFAULT 'Pedir por WhatsApp',
  is_visible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_products public read" ON public.shop_products
  FOR SELECT TO public USING (true);

CREATE POLICY "shop_products admin write" ON public.shop_products
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_products_touch
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add shop config columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS shop_title text DEFAULT 'Tienda oficial',
  ADD COLUMN IF NOT EXISTS shop_subtitle text DEFAULT 'Lleva contigo un trozo de la noche.',
  ADD COLUMN IF NOT EXISTS shop_whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS shop_cta_message text DEFAULT 'Hola! Quiero pedir información sobre este producto:',
  ADD COLUMN IF NOT EXISTS shop_fallback_url text,
  ADD COLUMN IF NOT EXISTS shop_fallback_text text DEFAULT 'Contáctanos';

-- Register the new section
INSERT INTO public.page_sections (section_key, section_name, sort_order, is_enabled, display_mode, admin_status, is_locked)
VALUES ('shop', 'Tienda', 12, true, 'visible', 'complete', false)
ON CONFLICT DO NOTHING;

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "shop-products public read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'shop-products');

CREATE POLICY "shop-products admin write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "shop-products admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "shop-products admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'::app_role));
