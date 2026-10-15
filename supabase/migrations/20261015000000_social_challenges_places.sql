-- Photo upvotes, places (cities/countries), golden-hour shots, and challenge progress.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
-- Requires the earlier migrations (init, badges, xp_and_badges).

-- XP never goes below zero (upvotes can be withdrawn)
create or replace function public.award_xp(p_user uuid, p_amount integer) returns void
language sql security definer set search_path = public as $$
  update public.users
  set xp = greatest(xp + p_amount, 0),
      explorer_rank = public.rank_for_xp(greatest(xp + p_amount, 0))
  where id = p_user
$$;
revoke all on function public.award_xp(uuid, integer) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Places: each spot records its city/country so profiles can count them
-- ─────────────────────────────────────────────────────────────
alter table public.spots add column if not exists city text not null default '';
alter table public.spots add column if not exists country text not null default '';
grant select (city, country) on public.spots to anon, authenticated;

create or replace view public.spots_public as
select
  id, name, description,
  case when is_private_property then round(latitude::numeric, 2)::double precision else latitude end as latitude,
  case when is_private_property then round(longitude::numeric, 2)::double precision else longitude end as longitude,
  is_private_property, founder_id, rank, difficulty, tags, cover_photo_url,
  photo_count, navigation_count, best_time_start, best_time_end, gear_recommendation, created_at,
  city, country
from public.spots;
grant select on public.spots_public to anon, authenticated;

-- Distinct cities/countries a user has shot in (spots they founded or photographed)
create or replace function public.refresh_user_places(p_user uuid) returns void
language sql security definer set search_path = public as $$
  with mine as (
    select s.city, s.country from public.spots s where s.founder_id = p_user
    union
    select s.city, s.country from public.spot_photos p join public.spots s on s.id = p.spot_id where p.user_id = p_user
  )
  update public.users set
    cities_visited = (select count(distinct (city, country)) from mine where city <> ''),
    countries_visited = (select count(distinct country) from mine where country <> '')
  where id = p_user
$$;
revoke all on function public.refresh_user_places(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Challenge progress: counts qualifying actions made while joined to an active challenge
-- requirement_type: found_spots | upload_photos | visit_spots | golden_hour_photos
-- ─────────────────────────────────────────────────────────────
create or replace function public.bump_challenges(p_user uuid, p_type text) returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  for r in
    select uc.challenge_id, uc.progress, c.requirement_count, c.xp_reward, c.badge_id
    from public.user_challenges uc
    join public.challenges c on c.id = uc.challenge_id
    where uc.user_id = p_user
      and uc.completed_at is null
      and c.requirement_type = p_type
      and now() between c.start_date and c.end_date
  loop
    if r.progress + 1 >= r.requirement_count then
      update public.user_challenges set progress = r.requirement_count, completed_at = now()
        where user_id = p_user and challenge_id = r.challenge_id;
      perform public.award_xp(p_user, r.xp_reward);
      if r.badge_id is not null then
        insert into public.user_badges (user_id, badge_id) values (p_user, r.badge_id)
        on conflict do nothing;
      end if;
    else
      update public.user_challenges set progress = r.progress + 1
        where user_id = p_user and challenge_id = r.challenge_id;
    end if;
  end loop;
end $$;
revoke all on function public.bump_challenges(uuid, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Golden-hour shots: the app flags photos taken during the spot's golden hour
-- ─────────────────────────────────────────────────────────────
alter table public.spot_photos add column if not exists golden_hour boolean not null default false;

-- Hook the new behaviour onto existing events
create or replace function public.events_on_spot_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.founder_id is not null then
    perform public.refresh_user_places(new.founder_id);
    perform public.bump_challenges(new.founder_id, 'found_spots');
  end if;
  return null;
end $$;
drop trigger if exists spots_events on public.spots;
create trigger spots_events after insert on public.spots
  for each row execute function public.events_on_spot_insert();

create or replace function public.events_on_photo_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_user_places(new.user_id);
    perform public.bump_challenges(new.user_id, 'upload_photos');
    if new.golden_hour then
      perform public.bump_challenges(new.user_id, 'golden_hour_photos');
      insert into public.user_badges (user_id, badge_id)
        select new.user_id, 'golden_hour' where exists (select 1 from public.badges where id = 'golden_hour')
        on conflict do nothing;
    end if;
  else
    perform public.refresh_user_places(old.user_id);
  end if;
  return null;
end $$;
drop trigger if exists spot_photos_events on public.spot_photos;
create trigger spot_photos_events after insert or delete on public.spot_photos
  for each row execute function public.events_on_photo_change();

create or replace function public.events_on_navigation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- only a first visit to a spot counts toward challenges
  if not exists (
    select 1 from public.spot_navigations
    where spot_id = new.spot_id and user_id = new.user_id and id <> new.id
  ) then
    perform public.bump_challenges(new.user_id, 'visit_spots');
  end if;
  return null;
end $$;
drop trigger if exists spot_navigations_events on public.spot_navigations;
create trigger spot_navigations_events after insert on public.spot_navigations
  for each row execute function public.events_on_navigation();

-- ─────────────────────────────────────────────────────────────
-- Photo upvotes: one per person per photo, not on your own; +10 XP to the photographer
-- ─────────────────────────────────────────────────────────────
create table if not exists public.photo_upvotes (
  photo_id uuid not null references public.spot_photos (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);
alter table public.photo_upvotes enable row level security;

drop policy if exists "photo_upvotes read" on public.photo_upvotes;
create policy "photo_upvotes read" on public.photo_upvotes for select to authenticated using (true);
drop policy if exists "photo_upvotes insert" on public.photo_upvotes;
create policy "photo_upvotes insert" on public.photo_upvotes for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (select 1 from public.spot_photos p where p.id = photo_id and p.user_id = auth.uid())
  );
drop policy if exists "photo_upvotes delete own" on public.photo_upvotes;
create policy "photo_upvotes delete own" on public.photo_upvotes for delete to authenticated using (user_id = auth.uid());

create or replace function public.on_photo_upvote() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  if tg_op = 'INSERT' then
    update public.spot_photos set upvotes = upvotes + 1 where id = new.photo_id returning user_id into v_owner;
    if v_owner is not null then perform public.award_xp(v_owner, 10); end if;
  else
    update public.spot_photos set upvotes = greatest(upvotes - 1, 0) where id = old.photo_id returning user_id into v_owner;
    if v_owner is not null then perform public.award_xp(v_owner, -10); end if;
  end if;
  return null;
end $$;
drop trigger if exists photo_upvotes_change on public.photo_upvotes;
create trigger photo_upvotes_change after insert or delete on public.photo_upvotes
  for each row execute function public.on_photo_upvote();

-- ─────────────────────────────────────────────────────────────
-- Starter challenges (30-day window from when this script runs; re-running refreshes them)
-- ─────────────────────────────────────────────────────────────
delete from public.challenges c
  where c.title in ('First Founder', 'Shutter Week', 'Golden Hunter', 'Out Exploring')
    and not exists (select 1 from public.user_challenges uc where uc.challenge_id = c.id);
insert into public.challenges (title, description, xp_reward, start_date, end_date, requirement_type, requirement_count)
select v.title, v.description, v.xp, now(), now() + v.days * interval '1 day', v.type, v.n
from (values
  ('First Founder', 'Found a brand-new spot nobody has pinned yet.', 200, 30, 'found_spots', 1),
  ('Shutter Week', 'Upload 5 photos to any spots this week.', 200, 7, 'upload_photos', 5),
  ('Golden Hunter', 'Shoot 3 photos during a spot''s golden hour.', 500, 30, 'golden_hour_photos', 3),
  ('Out Exploring', 'Navigate to 5 different spots.', 200, 30, 'visit_spots', 5)
) as v(title, description, xp, days, type, n)
where not exists (select 1 from public.challenges c where c.title = v.title and c.end_date > now());
