-- ClickIt initial schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this file → Run.
--
-- Rules (from CLAUDE.md):
--   * Row Level Security on every table
--   * Users can only edit their own data
--   * Public read on spots, spot_photos, challenges; signed-in access for the rest
--
-- Scores and counters (xp, rank, photo/navigation counts, upvotes, duel votes) are
-- maintained by triggers below and cannot be changed directly from the app.

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  avatar_url text not null default '',
  bio text not null default '' check (char_length(bio) <= 300),
  interest_tags text[] not null default '{}',
  explorer_rank text not null default 'bronze'
    check (explorer_rank in ('bronze', 'silver', 'gold', 'elite', 'legend')),
  xp integer not null default 0 check (xp >= 0),
  spots_founded integer not null default 0,
  spots_visited integer not null default 0,
  countries_visited integer not null default 0,
  cities_visited integer not null default 0,
  photos_uploaded integer not null default 0,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  is_private_property boolean not null default false,
  founder_id uuid default auth.uid() references public.users (id) on delete set null,
  rank text not null default 'undiscovered'
    check (rank in ('undiscovered', 'hidden_gem', 'popular', 'iconic', 'legendary')),
  difficulty text not null default 'easy'
    check (difficulty in ('easy', 'moderate', 'hard', 'permit_required')),
  tags text[] not null default '{}',
  cover_photo_url text not null default '',
  photo_count integer not null default 0,
  navigation_count integer not null default 0,
  best_time_start text not null default '',
  best_time_end text not null default '',
  gear_recommendation text not null default '',
  created_at timestamptz not null default now()
);
create index spots_lat_lng_idx on public.spots (latitude, longitude);

create table public.spot_photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  photo_url text not null,
  -- local wall-clock time at the spot when the photo was taken (from EXIF)
  taken_at timestamp,
  camera text not null default '',
  lens text not null default '',
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);
create index spot_photos_spot_idx on public.spot_photos (spot_id);
create index spot_photos_user_idx on public.spot_photos (user_id);

create table public.spot_saves (
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

create table public.spot_navigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index spot_navigations_spot_idx on public.spot_navigations (spot_id);

create table public.badges (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default ''
);

create table public.user_badges (
  user_id uuid not null references public.users (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  xp_reward integer not null default 0,
  badge_id text references public.badges (id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  requirement_type text not null,
  requirement_count integer not null default 1,
  check (end_date > start_date)
);

create table public.user_challenges (
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  progress integer not null default 0,
  completed_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create table public.duels (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  challenger_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  opponent_id uuid not null references public.users (id) on delete cascade,
  challenger_photo_url text,
  opponent_photo_url text,
  challenger_votes integer not null default 0,
  opponent_votes integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'active', 'voting', 'completed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (challenger_id <> opponent_id)
);
create index duels_spot_idx on public.duels (spot_id);

create table public.duel_votes (
  duel_id uuid not null references public.duels (id) on delete cascade,
  voter_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  voted_for text not null check (voted_for in ('challenger', 'opponent')),
  created_at timestamptz not null default now(),
  primary key (duel_id, voter_id)
);

create table public.followers (
  follower_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  following_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.spot_tags (
  spot_id uuid not null references public.spots (id) on delete cascade,
  tag text not null check (tag in (
    'sunset', 'sunrise', 'cityscape', 'nature', 'waterfall',
    'architecture', 'street_art', 'rooftop', 'hidden_gem', 'night'
  )),
  added_by uuid not null default auth.uid() references public.users (id) on delete cascade,
  primary key (spot_id, tag)
);

-- Community gear votes on a photo ("Best lens: 35mm (voted by 23 photographers)")
create table public.gear_tags (
  photo_id uuid not null references public.spot_photos (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  kind text not null check (kind in ('camera', 'lens')),
  value text not null check (char_length(value) between 1 and 60),
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id, kind)
);

create table public.spot_twins (
  id uuid primary key default gen_random_uuid(),
  spot_a_id uuid not null references public.spots (id) on delete cascade,
  spot_b_id uuid not null references public.spots (id) on delete cascade,
  similarity numeric(4, 3) not null default 0,
  created_at timestamptz not null default now(),
  check (spot_a_id <> spot_b_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Private-property spots: never expose exact coordinates
-- The app reads spots through this view; latitude/longitude on the base table are not readable.
-- Private spots are rounded to 2 decimals (~1 km) — approximate area only.
-- ─────────────────────────────────────────────────────────────

create view public.spots_public as
select
  id, name, description,
  case when is_private_property then round(latitude::numeric, 2)::double precision else latitude end as latitude,
  case when is_private_property then round(longitude::numeric, 2)::double precision else longitude end as longitude,
  is_private_property, founder_id, rank, difficulty, tags, cover_photo_url,
  photo_count, navigation_count, best_time_start, best_time_end, gear_recommendation, created_at
from public.spots;

-- ─────────────────────────────────────────────────────────────
-- Protect server-managed columns from direct edits by app users
-- (triggers run as the table owner, so they can still update these)
-- ─────────────────────────────────────────────────────────────

create function public.is_app_user() returns boolean
language sql stable as $$
  select current_user in ('anon', 'authenticated')
$$;

create function public.protect_users_columns() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if tg_op = 'INSERT' then
    new.explorer_rank := 'bronze';
    new.xp := 0;
    new.spots_founded := 0; new.spots_visited := 0;
    new.countries_visited := 0; new.cities_visited := 0;
    new.photos_uploaded := 0;
    new.followers_count := 0; new.following_count := 0;
    new.created_at := now();
  else
    new.id := old.id;
    new.explorer_rank := old.explorer_rank;
    new.xp := old.xp;
    new.spots_founded := old.spots_founded; new.spots_visited := old.spots_visited;
    new.countries_visited := old.countries_visited; new.cities_visited := old.cities_visited;
    new.photos_uploaded := old.photos_uploaded;
    new.followers_count := old.followers_count; new.following_count := old.following_count;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger users_protect before insert or update on public.users
  for each row execute function public.protect_users_columns();

create function public.protect_spots_columns() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if tg_op = 'INSERT' then
    new.founder_id := auth.uid();
    new.rank := 'undiscovered';
    new.photo_count := 0;
    new.navigation_count := 0;
    new.created_at := now();
  else
    new.founder_id := old.founder_id;
    new.rank := old.rank;
    new.photo_count := old.photo_count;
    new.navigation_count := old.navigation_count;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger spots_protect before insert or update on public.spots
  for each row execute function public.protect_spots_columns();

create function public.protect_spot_photos_columns() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.upvotes := 0;
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.spot_id := old.spot_id;
    new.upvotes := old.upvotes;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger spot_photos_protect before insert or update on public.spot_photos
  for each row execute function public.protect_spot_photos_columns();

create function public.protect_duels_columns() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if tg_op = 'INSERT' then
    new.challenger_id := auth.uid();
    new.challenger_votes := 0;
    new.opponent_votes := 0;
    new.status := 'pending';
    new.created_at := now();
  else
    new.spot_id := old.spot_id;
    new.challenger_id := old.challenger_id;
    new.opponent_id := old.opponent_id;
    new.challenger_votes := old.challenger_votes;
    new.opponent_votes := old.opponent_votes;
    new.expires_at := old.expires_at;
    new.created_at := old.created_at;
    -- each participant may only set their own photo
    if auth.uid() = old.challenger_id then
      new.opponent_photo_url := old.opponent_photo_url;
    else
      new.challenger_photo_url := old.challenger_photo_url;
    end if;
  end if;
  return new;
end $$;
create trigger duels_protect before insert or update on public.duels
  for each row execute function public.protect_duels_columns();

-- ─────────────────────────────────────────────────────────────
-- Counters kept in sync by triggers (security definer = runs as owner)
-- ─────────────────────────────────────────────────────────────

create function public.on_spot_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.users set spots_founded = spots_founded + 1 where id = new.founder_id;
  return null;
end $$;
create trigger spots_after_insert after insert on public.spots
  for each row execute function public.on_spot_insert();

create function public.on_spot_photo_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.spots set photo_count = photo_count + 1,
      cover_photo_url = case when cover_photo_url = '' then new.photo_url else cover_photo_url end
      where id = new.spot_id;
    update public.users set photos_uploaded = photos_uploaded + 1 where id = new.user_id;
  else
    update public.spots set photo_count = greatest(photo_count - 1, 0) where id = old.spot_id;
    update public.users set photos_uploaded = greatest(photos_uploaded - 1, 0) where id = old.user_id;
  end if;
  return null;
end $$;
create trigger spot_photos_after_change after insert or delete on public.spot_photos
  for each row execute function public.on_spot_photo_change();

create function public.on_spot_navigation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.spots set navigation_count = navigation_count + 1 where id = new.spot_id;
  return null;
end $$;
create trigger spot_navigations_after_insert after insert on public.spot_navigations
  for each row execute function public.on_spot_navigation();

create function public.on_follow_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.users set following_count = following_count + 1 where id = new.follower_id;
    update public.users set followers_count = followers_count + 1 where id = new.following_id;
  else
    update public.users set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.users set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end $$;
create trigger followers_after_change after insert or delete on public.followers
  for each row execute function public.on_follow_change();

create function public.on_duel_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.voted_for = 'challenger' then
    update public.duels set challenger_votes = challenger_votes + 1 where id = new.duel_id;
  else
    update public.duels set opponent_votes = opponent_votes + 1 where id = new.duel_id;
  end if;
  return null;
end $$;
create trigger duel_votes_after_insert after insert on public.duel_votes
  for each row execute function public.on_duel_vote();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.spots enable row level security;
alter table public.spot_photos enable row level security;
alter table public.spot_saves enable row level security;
alter table public.spot_navigations enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.duels enable row level security;
alter table public.duel_votes enable row level security;
alter table public.followers enable row level security;
alter table public.spot_tags enable row level security;
alter table public.gear_tags enable row level security;
alter table public.spot_twins enable row level security;
alter table public.notifications enable row level security;

-- users: profiles visible to signed-in users; you can create/edit only your own
create policy "users read" on public.users for select to authenticated using (true);
create policy "users insert own" on public.users for insert to authenticated with check (id = auth.uid());
create policy "users update own" on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- spots: public read (through spots_public); signed-in users create; founders edit/delete
create policy "spots read" on public.spots for select to anon, authenticated using (true);
create policy "spots insert" on public.spots for insert to authenticated with check (founder_id = auth.uid());
create policy "spots update own" on public.spots for update to authenticated
  using (founder_id = auth.uid()) with check (founder_id = auth.uid());
create policy "spots delete own" on public.spots for delete to authenticated using (founder_id = auth.uid());
-- exact coordinates are not readable from the app; read them through spots_public
revoke select on public.spots from anon, authenticated;
grant select (id, name, description, is_private_property, founder_id, rank, difficulty, tags,
  cover_photo_url, photo_count, navigation_count, best_time_start, best_time_end,
  gear_recommendation, created_at) on public.spots to anon, authenticated;
grant select on public.spots_public to anon, authenticated;

-- spot_photos: public read; you manage your own photos
create policy "spot_photos read" on public.spot_photos for select to anon, authenticated using (true);
create policy "spot_photos insert own" on public.spot_photos for insert to authenticated with check (user_id = auth.uid());
create policy "spot_photos update own" on public.spot_photos for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "spot_photos delete own" on public.spot_photos for delete to authenticated using (user_id = auth.uid());

-- spot_saves: private to each user
create policy "spot_saves own" on public.spot_saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- spot_navigations: you log and see your own
create policy "spot_navigations read own" on public.spot_navigations for select to authenticated using (user_id = auth.uid());
create policy "spot_navigations insert own" on public.spot_navigations for insert to authenticated with check (user_id = auth.uid());

-- badges: read-only catalog (managed from the dashboard)
create policy "badges read" on public.badges for select to authenticated using (true);

-- user_badges: visible on profiles; awarded by the server only
create policy "user_badges read" on public.user_badges for select to authenticated using (true);

-- challenges: public read; managed from the dashboard
create policy "challenges read" on public.challenges for select to anon, authenticated using (true);

-- user_challenges: you join and see your own progress (completion is awarded server-side later)
create policy "user_challenges read own" on public.user_challenges for select to authenticated using (user_id = auth.uid());
create policy "user_challenges join" on public.user_challenges for insert to authenticated
  with check (user_id = auth.uid() and progress = 0 and completed_at is null);
create policy "user_challenges leave" on public.user_challenges for delete to authenticated using (user_id = auth.uid());

-- duels: visible to signed-in users; you start duels and update ones you're in
create policy "duels read" on public.duels for select to authenticated using (true);
create policy "duels insert" on public.duels for insert to authenticated with check (challenger_id = auth.uid());
create policy "duels update participants" on public.duels for update to authenticated
  using (auth.uid() in (challenger_id, opponent_id)) with check (auth.uid() in (challenger_id, opponent_id));

-- duel_votes: one vote per user per duel; participants can't vote in their own duel
create policy "duel_votes read own" on public.duel_votes for select to authenticated using (voter_id = auth.uid());
create policy "duel_votes insert" on public.duel_votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and not exists (
      select 1 from public.duels d
      where d.id = duel_id and auth.uid() in (d.challenger_id, d.opponent_id)
    )
    and exists (select 1 from public.duels d where d.id = duel_id and d.status = 'voting')
  );

-- followers: visible to signed-in users; you follow/unfollow as yourself
create policy "followers read" on public.followers for select to authenticated using (true);
create policy "followers insert own" on public.followers for insert to authenticated with check (follower_id = auth.uid());
create policy "followers delete own" on public.followers for delete to authenticated using (follower_id = auth.uid());

-- spot_tags: visible to signed-in users; you add/remove tags you added
create policy "spot_tags read" on public.spot_tags for select to authenticated using (true);
create policy "spot_tags insert own" on public.spot_tags for insert to authenticated with check (added_by = auth.uid());
create policy "spot_tags delete own" on public.spot_tags for delete to authenticated using (added_by = auth.uid());

-- gear_tags: visible to signed-in users; you manage your own votes
create policy "gear_tags read" on public.gear_tags for select to authenticated using (true);
create policy "gear_tags own" on public.gear_tags for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- spot_twins: read-only (generated server-side)
create policy "spot_twins read" on public.spot_twins for select to authenticated using (true);

-- notifications: private; you can read and mark your own as read
create policy "notifications read own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications update own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
