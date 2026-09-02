-- RIHULA TEMPORARY CUSTOM MEMBER AUTHENTICATION
-- Run this in the CURRENT RIHULA Supabase SQL Editor.
-- This replaces MEMBER Supabase Auth temporarily. Admin Auth is unchanged.
-- Later, remove this bridge and migrate members back to Supabase Auth.

create extension if not exists pgcrypto;

-- The current project already uses the legacy members.password field.
-- This bridge keeps that field for compatibility with the existing member dashboard.

create or replace function public.rihula_custom_register(
  p_name text,
  p_phone text,
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member jsonb;
  v_phone text;
  v_email text;
begin
  v_phone := regexp_replace(trim(coalesce(p_phone,'')), '[^0-9+]', '', 'g');
  if left(v_phone, 4) = '+254' then
    v_phone := '0' || substr(v_phone, 5);
  elsif left(v_phone, 3) = '254' then
    v_phone := '0' || substr(v_phone, 4);
  end if;

  v_email := lower(trim(coalesce(p_email,'')));

  if trim(coalesce(p_name,'')) = '' then
    return jsonb_build_object('success',false,'message','Enter your full name.');
  end if;
  if length(v_phone) < 10 then
    return jsonb_build_object('success',false,'message','Enter a valid Kenyan phone number.');
  end if;
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('success',false,'message','Enter a valid email address.');
  end if;
  if length(coalesce(p_password,'')) < 8 then
    return jsonb_build_object('success',false,'message','Password must contain at least 8 characters.');
  end if;

  if exists (select 1 from public.members where regexp_replace(coalesce(phone,''),'[^0-9]','','g') = regexp_replace(v_phone,'[^0-9]','','g')) then
    return jsonb_build_object('success',false,'message','This phone number is already registered.');
  end if;

  if exists (select 1 from public.members where lower(coalesce(email,'')) = v_email) then
    return jsonb_build_object('success',false,'message','This email address is already registered.');
  end if;

  insert into public.members (name, phone, email, password, role, status, online)
  values (trim(p_name), v_phone, v_email, p_password, 'member', 'pending', false)
  returning to_jsonb(public.members.*) - 'password' into v_member;

  return jsonb_build_object('success',true,'member',v_member,'message','Registration successful.');
exception
  when undefined_column then
    return jsonb_build_object('success',false,'message','The members table is missing a required column. Check that name, phone, email and password exist.');
  when others then
    return jsonb_build_object('success',false,'message',sqlerrm);
end;
$$;

create or replace function public.rihula_custom_login(
  p_login text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member jsonb;
  v_login text := lower(trim(coalesce(p_login,'')));
  v_phone text;
begin
  v_phone := regexp_replace(v_login, '[^0-9+]', '', 'g');
  if left(v_phone, 4) = '+254' then
    v_phone := '0' || substr(v_phone, 5);
  elsif left(v_phone, 3) = '254' then
    v_phone := '0' || substr(v_phone, 4);
  end if;

  select to_jsonb(m) - 'password'
    into v_member
  from public.members m
  where (
    lower(coalesce(m.email,'')) = v_login
    or regexp_replace(coalesce(m.phone,''),'[^0-9]','','g') = regexp_replace(v_phone,'[^0-9]','','g')
  )
  and coalesce(m.password,'') = coalesce(p_password,'')
  limit 1;

  if v_member is null then
    return jsonb_build_object('success',false,'message','Invalid email/phone or password.');
  end if;

  return jsonb_build_object('success',true,'member',v_member);
end;
$$;

create or replace function public.rihula_custom_change_password(
  p_member_id bigint,
  p_current_password text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(coalesce(p_new_password,'')) < 8 then
    return jsonb_build_object('success',false,'message','Password must contain at least 8 characters.');
  end if;

  update public.members
  set password = p_new_password
  where id = p_member_id
    and password = p_current_password;

  if not found then
    return jsonb_build_object('success',false,'message','Current password is incorrect.');
  end if;

  return jsonb_build_object('success',true,'message','Password changed successfully.');
end;
$$;

revoke all on function public.rihula_custom_register(text,text,text,text) from public;
revoke all on function public.rihula_custom_login(text,text) from public;
revoke all on function public.rihula_custom_change_password(bigint,text,text) from public;
grant execute on function public.rihula_custom_register(text,text,text,text) to anon, authenticated;
grant execute on function public.rihula_custom_login(text,text) to anon, authenticated;
grant execute on function public.rihula_custom_change_password(bigint,text,text) to anon, authenticated;

-- IMPORTANT SECURITY NOTE:
-- This is a temporary compatibility bridge because the current project keeps
-- passwords in members.password. Do NOT treat it as the final production auth
-- architecture. The planned final architecture is Supabase Auth.
