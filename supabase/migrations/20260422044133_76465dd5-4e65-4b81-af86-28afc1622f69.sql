
-- Add new columns to roms
ALTER TABLE public.roms
  ADD COLUMN IF NOT EXISTS build_flavor text,        -- 'gapps' | 'vanilla'
  ADD COLUMN IF NOT EXISTS official_status text,     -- 'official' | 'unofficial'
  ADD COLUMN IF NOT EXISTS flash_type text,          -- 'dirty' | 'clean'
  ADD COLUMN IF NOT EXISTS build_date date;

-- Add owner column to site_links
ALTER TABLE public.site_links
  ADD COLUMN IF NOT EXISTS owner text;  -- 'mufasa' | 'nullpointer' | null

-- Activate lemonade
UPDATE public.devices SET status = 'active', is_active = true WHERE codename = 'lemonade';

-- Kernels table
CREATE TABLE IF NOT EXISTS public.kernels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  name text NOT NULL,
  kernel_type text,            -- 'A16' | 'MIUI' | 'HOS' | other
  maintainer text,
  build_date date,
  download_url text NOT NULL,
  source_url text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kernels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active kernels" ON public.kernels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all kernels" ON public.kernels
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage kernels" ON public.kernels
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_kernels_updated_at
  BEFORE UPDATE ON public.kernels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recoveries table
CREATE TABLE IF NOT EXISTS public.recoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  name text NOT NULL,
  maintainer text,
  build_date date,
  download_url text NOT NULL,
  source_url text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active recoveries" ON public.recoveries
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all recoveries" ON public.recoveries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage recoveries" ON public.recoveries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_recoveries_updated_at
  BEFORE UPDATE ON public.recoveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed donation links per owner
-- Update existing links to assign default owner = nullpointer (existing payments)
UPDATE public.site_links SET owner = 'nullpointer' WHERE category = 'payment' AND owner IS NULL;

-- Add Mufasa donation links (idempotent on key)
INSERT INTO public.site_links (key, label, url, category, icon, sort_order, is_active, owner)
VALUES
  ('mufasa_kofi',   'Ko-fi',  'https://ko-fi.com/mufasaxz',                                    'payment', 'kofi',   10, true, 'mufasa'),
  ('mufasa_upi',    'UPI',    'upi://pay?pa=mufasa@upi&pn=Mufasa',                              'payment', 'upi',    11, true, 'mufasa'),
  ('mufasa_paypal', 'PayPal', 'https://www.paypal.com/paypalme/mufasaxz',                       'payment', 'paypal', 12, true, 'mufasa'),
  ('telegram',      'Telegram Channel', 'https://t.me/sd870',                                   'channel', 'telegram', 0, true, NULL)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label, owner = EXCLUDED.owner;
