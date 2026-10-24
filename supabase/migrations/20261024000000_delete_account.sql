-- In-app account deletion (required by Apple for apps with accounts).
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
--
-- delete_my_account() deletes the signed-in user's login. That cascades to their profile and
-- everything tied to it (photos, saves, follows, upvotes, challenges, duels, votes, badges).
-- Before that, it tidies up spots so nothing is left pointing at the deleted user's photos:
--   - spots whose cover is one of their photos get another person's best photo as cover (or none)
--   - spots they founded that nobody else has photographed are removed
--   - spots they founded that others have photographed stay, without a founder

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  update public.spots s
  set cover_photo_url = coalesce((
    select p.photo_url from public.spot_photos p
    where p.spot_id = s.id and p.user_id <> v_user
    order by p.upvotes desc, p.created_at desc
    limit 1
  ), '')
  where s.cover_photo_url in (select photo_url from public.spot_photos where user_id = v_user);

  delete from public.spots s
  where s.founder_id = v_user
    and not exists (select 1 from public.spot_photos p where p.spot_id = s.id and p.user_id <> v_user);

  delete from auth.users where id = v_user;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
