-- RIHULA AUTH FIX BUNDLE
-- Run this in the CURRENT RIHULA Supabase SQL Editor.
-- This aligns member registration, activation and dual-role Auth.

create extension if not exists pgcrypto;

alter table public.members add column if not exists auth_id uuid;
alter table public.members add column if not exists is_admin boolean not null default false;
alter table public.members add column if not exists is_member boolean not null default true;

create or replace function public.rihula_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name',''));
  v_phone text := trim(coalesce(new.raw_user_meta_data->>'phone',''));
begin
  update public.members m
  set auth_id = new.id,
      email = lower(coalesce(new.email, m.email)),
      name = coalesce(nullif(v_name,''), m.name),
      phone = coalesce(nullif(v_phone,''), m.phone),
      is_member = true
  where m.auth_id is null
    and ((v_phone <> '' and regexp_replace(coalesce(m.phone,''),'[^0-9]','','g') = regexp_replace(v_phone,'[^0-9]','','g'))
      or (new.email is not null and lower(coalesce(m.email,'')) = lower(new.email)));

  if not found then
    insert into public.members(auth_id,name,phone,email,role,status,online,is_admin,is_member)
    values(new.id,nullif(v_name,''),nullif(v_phone,''),lower(new.email),'member','pending',false,false,true);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rihula on auth.users;
create trigger on_auth_user_created_rihula
after insert on auth.users
for each row execute function public.rihula_handle_new_auth_user();

create or replace function public.is_rihula_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.members m where m.auth_id = auth.uid() and m.is_admin = true and lower(coalesce(m.status,'active')) not in ('blocked','suspended','inactive'));
$$;

revoke all on function public.is_rihula_admin() from public;
grant execute on function public.is_rihula_admin() to authenticated;

create or replace function public.activate_old_member(p_phone text,p_old_password text,p_email text,p_auth_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_phone text; v_member public.members%rowtype;
begin
 v_phone := regexp_replace(coalesce(p_phone,''),'[^0-9+]','','g');
 if left(v_phone,4)='+254' then v_phone:='0'||substr(v_phone,5); elsif left(v_phone,3)='254' then v_phone:='0'||substr(v_phone,4); end if;
 select * into v_member from public.members where regexp_replace(coalesce(phone::text,''),'[^0-9]','','g')=regexp_replace(v_phone,'[^0-9]','','g') limit 1;
 if v_member.id is null then return jsonb_build_object('success',false,'message','No member was found with that phone number.'); end if;
 if v_member.password is distinct from p_old_password then return jsonb_build_object('success',false,'message','The old member password is incorrect.'); end if;
 if v_member.auth_id is not null and v_member.auth_id <> p_auth_id then return jsonb_build_object('success',false,'message','This member is already linked to another login account.'); end if;
 update public.members set auth_id=p_auth_id,email=lower(trim(p_email)),is_member=true where id=v_member.id;
 return jsonb_build_object('success',true,'message','Member activated successfully.');
end;
$$;

revoke all on function public.activate_old_member(text,text,text,uuid) from public;
grant execute on function public.activate_old_member(text,text,text,uuid) to anon, authenticated;




-- FINAL REGISTRATION TRIGGER OVERRIDE
-- RIHULA REGISTRATION DATABASE ERROR FIX
-- Run this in the SAME Supabase project used by supabase.js.
-- This fixes "Database error saving new user" caused by conflicting
-- auth.users -> public.members triggers.

begin;

alter table public.members add column if not exists auth_id uuid;
alter table public.members add column if not exists is_admin boolean not null default false;
alter table public.members add column if not exists is_member boolean not null default true;

-- IMPORTANT:
-- The project previously had two triggers on auth.users. The old trigger
-- calls handle_new_auth_user() and inserts into columns that do not exist
-- in the current members table (for example full_name). That causes signup
-- to fail with "Database error saving new user".
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_rihula on auth.users;

create or replace function public.rihula_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name',''));
  v_phone text := trim(coalesce(new.raw_user_meta_data->>'phone',''));
  v_email text := lower(trim(coalesce(new.email,'')));
  v_member_id bigint;
begin
  -- If this Auth user is already linked, do nothing.
  select m.id
    into v_member_id
  from public.members m
  where m.auth_id = new.id
  limit 1;

  -- Otherwise link an existing unlinked member with the same email or phone.
  if v_member_id is null then
    select m.id
      into v_member_id
    from public.members m
    where m.auth_id is null
      and (
        (v_email <> '' and lower(coalesce(m.email,'')) = v_email)
        or
        (
          v_phone <> ''
          and regexp_replace(coalesce(m.phone::text,''),'[^0-9]','','g')
              = regexp_replace(v_phone,'[^0-9]','','g')
        )
      )
    order by m.id
    limit 1;
  end if;

  if v_member_id is not null then
    update public.members
    set auth_id = new.id,
        email = case when v_email <> '' then v_email else email end,
        name = coalesce(nullif(v_name,''), name),
        phone = coalesce(nullif(v_phone,''), phone),
        role = coalesce(nullif(role,''), 'member'),
        status = coalesce(nullif(status,''), 'pending'),
        online = coalesce(online, false),
        is_member = true
    where id = v_member_id;
  else
    insert into public.members
      (auth_id, name, phone, email, role, status, online, is_admin, is_member)
    values
      (new.id, nullif(v_name,''), nullif(v_phone,''), nullif(v_email,''),
       'member', 'pending', false, false, true);
  end if;

  return new;
end;
$$;

-- Install exactly ONE registration trigger.
create trigger on_auth_user_created_rihula
after insert on auth.users
for each row
execute function public.rihula_handle_new_auth_user();

-- Admin helper supports users who are both admin and member.
create or replace function public.is_rihula_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.auth_id = auth.uid()
      and (
        m.is_admin = true
        or lower(coalesce(m.role,'')) in
          ('admin','administrator','chairperson','secretary','treasurer')
      )
      and lower(coalesce(m.status,'active')) not in
          ('blocked','suspended','inactive')
  );
$$;

revoke all on function public.is_rihula_admin() from public;
grant execute on function public.is_rihula_admin() to authenticated;

commit;
