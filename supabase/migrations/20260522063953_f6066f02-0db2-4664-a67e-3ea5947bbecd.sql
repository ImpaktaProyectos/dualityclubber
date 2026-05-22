-- Create ticket_tiers table
CREATE TABLE IF NOT EXISTS public.ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price text,
  previous_price text,
  currency text DEFAULT '€',
  status text NOT NULL DEFAULT 'available',
  badge_text text,
  button_text text DEFAULT 'Comprar entrada',
  purchase_url text,
  open_in_new_tab boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_tiers public read" ON public.ticket_tiers FOR SELECT USING (true);
CREATE POLICY "ticket_tiers admin write" ON public.ticket_tiers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ticket_tiers_touch BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Extend site_settings with visual ticketer fields
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ticket_global_url text,
  ADD COLUMN IF NOT EXISTS use_global_ticket_url boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_alert_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_alert_text text,
  ADD COLUMN IF NOT EXISTS ticket_alert_type text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS ticket_alert_url text,
  ADD COLUMN IF NOT EXISTS tier_countdown_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier_countdown_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS tier_countdown_text text;