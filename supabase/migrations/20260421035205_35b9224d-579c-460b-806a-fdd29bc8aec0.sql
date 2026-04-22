CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

INSERT INTO public.devices (codename, display_name, status, image_url, description, sort_order)
VALUES
  ('pipa', 'Xiaomi Pad 6', 'active', 'https://mufasaxz.github.io/SD870/assets/images/pipa.png', 'Snapdragon 870 powered tablet.', 1),
  ('lemonades', 'OnePlus 9R', 'active', null, 'Snapdragon 870 flagship killer.', 2)
ON CONFLICT (codename) DO NOTHING;

INSERT INTO public.site_links (key, label, url, category, icon, sort_order) VALUES
  ('telegram', 'Telegram Channel', 'https://t.me/', 'channel', 'send', 1),
  ('github', 'GitHub', 'https://github.com/mufasaxz/SD870', 'social', 'github', 2),
  ('donate', 'Donate', 'https://paypal.me/', 'payment', 'heart', 3)
ON CONFLICT (key) DO NOTHING;