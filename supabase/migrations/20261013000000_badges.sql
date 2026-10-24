-- Badge catalog shown on the Profile screen (ids must match src/lib/badges.ts).
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
insert into public.badges (id, name, description, icon) values
  ('first_pin',    'First Pin',    'Found your first spot',           'flag'),
  ('trailblazer',  'Trailblazer',  'Found 10 spots',                  'compass'),
  ('shutterbug',   'Shutterbug',   'Upload 25 photos',                'camera'),
  ('golden_hour',  'Golden Hour',  'Shoot a spot in its golden hour', 'sunset'),
  ('explorer',     'Explorer',     'Visit 25 spots',                  'footprints'),
  ('city_hopper',  'City Hopper',  'Shoot in 10 cities',              'building'),
  ('globetrotter', 'Globetrotter', 'Shoot in 5 countries',            'globe'),
  ('local_legend', 'Local Legend', 'Reach 100 followers',             'users')
on conflict (id) do update
  set name = excluded.name, description = excluded.description, icon = excluded.icon;
