-- RIHULA PHONE + PASSWORD MEMBER LOGIN
-- Run this ONCE in the CURRENT RIHULA Supabase SQL Editor.
-- Registration remains email-based internally, but members can log in
-- using the phone number they registered with plus their password.

create or replace function public.rihula_get_auth_email_by_phone(p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_email text;
begin
  v_phone := regexp_replace(trim(coalesce(p_phone,'')), '[^0-9+]', '', 'g');

  if left(v_phone,4) = '+254' then
    v_phone := '0' || substr(v_phone,5);
  elsif left(v_phone,3) = '254' then
    v_phone := '0' || substr(v_phone,4);
  end if;

  select lower(trim(m.email))
    into v_email
  from public.members m
  where regexp_replace(coalesce(m.phone,''), '[^0-9]', '', 'g') = regexp_replace(v_phone, '[^0-9]', '', 'g')
    and coalesce(m.is_member, true) = true
    and lower(coalesce(m.status,'pending')) not in ('blocked','suspended','inactive','rejected')
    and nullif(trim(coalesce(m.email,'')), '') is not null
    and m.auth_id is not null
  limit 1;

  return v_email;
end;
$$;

revoke all on function public.rihula_get_auth_email_by_phone(text) from public;
grant execute on function public.rihula_get_auth_email_by_phone(text) to anon, authenticated;
