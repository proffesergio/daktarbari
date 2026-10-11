-- Site settings key-value (map tiles, future API keys, feature flags).
-- Admin panel (service_role) writes; public reads map tiles only via API.
create table if not exists site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

-- No direct public access: reads go through /api/settings/map (server-side).
-- Admin uses service_role which bypasses RLS.
drop policy if exists "no public read settings" on site_settings;

-- Seed defaults (free OSM, no key required)
insert into site_settings (key, value) values
  ('map_tile_url', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  ('map_attribution', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Boundaries: <a href="https://www.geoboundaries.org">geoBoundaries CC-BY-4.0</a>'),
  ('map_api_key', '')
on conflict (key) do nothing;
