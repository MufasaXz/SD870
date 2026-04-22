
-- Update existing telegram link to be the main channel #1, and add channel #2 + group
UPDATE public.site_links
SET label = 'PAD6Repo', url = 'https://t.me/PAD6Repo', icon = 'telegram', owner = 'channel1', sort_order = 0
WHERE key = 'telegram';

INSERT INTO public.site_links (key, label, url, category, icon, sort_order, is_active, owner)
VALUES
  ('telegram_royallabs', 'royallabs', 'https://t.me/royallabs', 'channel', 'telegram', 1, true, 'channel2'),
  ('telegram_group',     'Discussion Group', 'https://t.me/+OasTvFriJ6I0NWM1', 'channel', 'telegram', 2, true, 'group')
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label, url = EXCLUDED.url, icon = EXCLUDED.icon,
      owner = EXCLUDED.owner, sort_order = EXCLUDED.sort_order, is_active = true;
