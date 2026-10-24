-- Shot Duel fixes. Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
--
-- - The 72-hour voting clock now starts when the opponent accepts (it used to start at the invite)
-- - An invite has 72 hours to be answered; after that it expires and can't be accepted
-- - Votes are only accepted until the deadline
-- - settle_duel also closes invites nobody answered

-- Triggers on the same event fire in name order: "duels_status_guard" runs after "duels_protect",
-- so the new deadline set here isn't reset by the column guard
drop trigger if exists duels_guard_status on public.duels;
create or replace function public.guard_duel_status() returns trigger
language plpgsql as $$
begin
  if not public.is_app_user() then return new; end if;
  if new.status is distinct from old.status then
    -- only the opponent may answer, only while the invite is open, only by accepting or declining
    if not (old.status = 'pending' and auth.uid() = old.opponent_id and old.expires_at > now()
            and new.status in ('voting', 'completed')) then
      new.status := old.status;
    end if;
    -- accepting requires the opponent's photo
    if new.status = 'voting' and coalesce(new.opponent_photo_url, '') = '' then
      new.status := old.status;
    end if;
    if old.status = 'pending' and new.status = 'voting' then
      new.expires_at := now() + interval '72 hours';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists duels_status_guard on public.duels;
create trigger duels_status_guard before update on public.duels
  for each row execute function public.guard_duel_status();

drop policy if exists "duel_votes insert" on public.duel_votes;
create policy "duel_votes insert" on public.duel_votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and not exists (
      select 1 from public.duels d
      where d.id = duel_id and auth.uid() in (d.challenger_id, d.opponent_id)
    )
    and exists (select 1 from public.duels d where d.id = duel_id and d.status = 'voting' and d.expires_at > now())
  );

create or replace function public.settle_duel(p_duel uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  d public.duels%rowtype;
  v_winner uuid;
begin
  select * into d from public.duels where id = p_duel for update;
  if not found then return 'not_found'; end if;
  if d.status = 'pending' then
    if d.expires_at > now() then return 'pending'; end if;
    update public.duels set status = 'completed' where id = p_duel;
    return 'expired';
  end if;
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
