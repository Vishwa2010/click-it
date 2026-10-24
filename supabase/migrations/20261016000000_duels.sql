-- Shot Duels: settle a finished duel and award the winner (+150 XP, DUEL_WON).
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
--
-- Flow: challenger creates a duel with their photo (status 'pending', expires_at = voting deadline)
--       → opponent accepts with their photo (status 'voting') or declines (status 'completed')
--       → anyone votes while 'voting' (one vote each, not the duelists)
--       → after expires_at anyone may call settle_duel(); the winner is paid exactly once.

-- Only the opponent may answer an invite, and only by accepting (voting) or declining (completed)
create or replace function public.guard_duel_status() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if new.status is distinct from old.status then
    if not (old.status = 'pending' and auth.uid() = old.opponent_id and new.status in ('voting', 'completed')) then
      new.status := old.status;
    end if;
    -- accepting requires the opponent's photo
    if new.status = 'voting' and coalesce(new.opponent_photo_url, '') = '' then
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists duels_guard_status on public.duels;
create trigger duels_guard_status before update on public.duels
  for each row execute function public.guard_duel_status();

create or replace function public.settle_duel(p_duel uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  d public.duels%rowtype;
  v_winner uuid;
begin
  select * into d from public.duels where id = p_duel for update;
  if not found then return 'not_found'; end if;
  if d.status <> 'voting' then return d.status; end if;
  if d.expires_at > now() then return 'still_voting'; end if;

  if d.challenger_votes > d.opponent_votes then v_winner := d.challenger_id;
  elsif d.opponent_votes > d.challenger_votes then v_winner := d.opponent_id;
  end if;

  update public.duels set status = 'completed' where id = p_duel;
  if v_winner is not null then
    perform public.award_xp(v_winner, 150);
  end if;
  return coalesce(v_winner::text, 'tie');
end $$;
revoke all on function public.settle_duel(uuid) from public, anon;
grant execute on function public.settle_duel(uuid) to authenticated;
