-- XP, Explorer rank and badge awarding — all server-side, so the app can't fake it.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
--
-- XP (CLAUDE.md XP_REWARDS):
--   +100  founding a new spot
--   +20   adding a photo to a spot (not the founding photo of your own new spot)
--   +50   to a spot's founder the first time someone else navigates to it
-- Rank follows XP: bronze 0 · silver 1,000 · gold 5,000 · elite 15,000 · legend 40,000

create or replace function public.rank_for_xp(p_xp integer) returns text
language sql immutable as $$
  select case
    when p_xp >= 40000 then 'legend'
    when p_xp >= 15000 then 'elite'
    when p_xp >= 5000 then 'gold'
    when p_xp >= 1000 then 'silver'
    else 'bronze'
  end
$$;

-- Only callable from the triggers below (security definer runs as the owner)
create or replace function public.award_xp(p_user uuid, p_amount integer) returns void
language sql security definer set search_path = public as $$
  update public.users
  set xp = xp + p_amount,
      explorer_rank = public.rank_for_xp(xp + p_amount)
  where id = p_user
$$;
revoke all on function public.award_xp(uuid, integer) from public, anon, authenticated;

-- Founding a spot
create or replace function public.xp_on_spot_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.founder_id is not null then
    perform public.award_xp(new.founder_id, 100);
  end if;
  return null;
end $$;
drop trigger if exists spots_award_xp on public.spots;
create trigger spots_award_xp after insert on public.spots
  for each row execute function public.xp_on_spot_insert();

-- Adding a photo
create or replace function public.xp_on_photo_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_founder uuid;
  v_other_photos boolean;
begin
  select founder_id into v_founder from public.spots where id = new.spot_id;
  select exists (select 1 from public.spot_photos where spot_id = new.spot_id and id <> new.id) into v_other_photos;
  -- The first photo on your own brand-new spot is part of founding it (already +100)
  if v_other_photos or v_founder is distinct from new.user_id then
    perform public.award_xp(new.user_id, 20);
  end if;
  return null;
end $$;
drop trigger if exists spot_photos_award_xp on public.spot_photos;
create trigger spot_photos_award_xp after insert on public.spot_photos
  for each row execute function public.xp_on_photo_insert();

-- Navigating to a spot: counts as a visit once per person per spot, and rewards the founder
create or replace function public.xp_on_navigation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_founder uuid;
  v_first boolean;
begin
  select not exists (
    select 1 from public.spot_navigations
    where spot_id = new.spot_id and user_id = new.user_id and id <> new.id
  ) into v_first;
  if not v_first then return null; end if;

  update public.users set spots_visited = spots_visited + 1 where id = new.user_id;
  select founder_id into v_founder from public.spots where id = new.spot_id;
  if v_founder is not null and v_founder <> new.user_id then
    perform public.award_xp(v_founder, 50);
  end if;
  return null;
end $$;
drop trigger if exists spot_navigations_award_xp on public.spot_navigations;
create trigger spot_navigations_award_xp after insert on public.spot_navigations
  for each row execute function public.xp_on_navigation();

-- Badges unlock automatically when a counter crosses its threshold (ids match src/lib/badges.ts).
-- Only badges present in public.badges are awarded, so this is safe before the catalog is seeded.
create or replace function public.award_badges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select new.id, b.id
  from public.badges b
  where (b.id = 'first_pin'    and new.spots_founded     >= 1)
     or (b.id = 'trailblazer'  and new.spots_founded     >= 10)
     or (b.id = 'shutterbug'   and new.photos_uploaded   >= 25)
     or (b.id = 'explorer'     and new.spots_visited     >= 25)
     or (b.id = 'city_hopper'  and new.cities_visited    >= 10)
     or (b.id = 'globetrotter' and new.countries_visited >= 5)
     or (b.id = 'local_legend' and new.followers_count   >= 100)
  on conflict (user_id, badge_id) do nothing;
  return null;
end $$;
drop trigger if exists users_award_badges on public.users;
create trigger users_award_badges after update on public.users
  for each row execute function public.award_badges();

-- Signed-in users may read the catalog of who-earned-what for profiles, but never write it
revoke insert, update, delete on public.user_badges from anon, authenticated;
