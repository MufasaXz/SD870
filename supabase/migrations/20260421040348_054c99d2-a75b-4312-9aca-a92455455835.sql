
-- Seed devices (idempotent on codename)
INSERT INTO public.devices (codename, display_name, status, image_url, description, sort_order, is_active)
VALUES
  ('pipa', 'Xiaomi Pad 6', 'active', '/assets/pipa.png',
   'Snapdragon 870 · 11" 144Hz · 8840 mAh', 0, true),
  ('lemonade', 'OnePlus 9R', 'soon', '/assets/lemonade.png',
   'Snapdragon 870 · 6.55" 120Hz · 4500 mAh', 1, true)
ON CONFLICT (codename) DO UPDATE
SET display_name = EXCLUDED.display_name,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- Make codename unique if not already
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_codename_key') THEN
    ALTER TABLE public.devices ADD CONSTRAINT devices_codename_key UNIQUE (codename);
  END IF;
END $$;

-- Seed support links (idempotent on key)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_links_key_key') THEN
    ALTER TABLE public.site_links ADD CONSTRAINT site_links_key_key UNIQUE (key);
  END IF;
END $$;

INSERT INTO public.site_links (key, label, url, category, icon, sort_order, is_active)
VALUES
  ('kofi',   'Ko-fi',  'https://ko-fi.com/nullpointer1101',         'payment', 'kofi',   0, true),
  ('upi',    'UPI',    'upi://pay?pa=nullpointe1101@ptaxis&pn=NullPointer', 'payment', 'upi', 1, true),
  ('paypal', 'PayPal', 'https://www.paypal.com/paypalme/sheoranpranshu', 'payment', 'paypal', 2, true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label, url = EXCLUDED.url, category = EXCLUDED.category,
    icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- Create the Bhosdu admin account
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'bhosdu@sd870.local';
  v_password text := 'Bhosdu123';
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('username','Bhosdu'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', now(), now(), now());
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
