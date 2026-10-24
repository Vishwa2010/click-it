-- Removes all ClickIt SAMPLE DATA (the 5 sample accounts and everything they posted).
begin;
delete from public.spots where id::text like '5a5a5a5a-%';
delete from auth.users where email like 'clickit-sample-%@example.com';
commit;
