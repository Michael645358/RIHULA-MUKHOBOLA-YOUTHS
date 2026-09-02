-- RIHULA DUAL ROLE MIGRATION
-- Safe to run after the previous clean Supabase Auth SQL.

-- 1. Add independent permissions.
alter table public.members
  add column if not exists is_admin boolean not null default false;

alter table public.members
  add column if not exists is_member boolean not null default true;

-- 2. Preserve existing behaviour while moving to dual roles.
update public.members
set is_member = true
where is_member is distinct from true;

update public.members
set is_admin = true
where lower(coalesce(role, '')) in (
  'admin', 'administrator', 'chairperson', 'secretary', 'treasurer'
);

-- 3. New registrations are members by default, not admins.
create or replace function public.rihula_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name', ''));
  v_phone text := trim(coalesce(new.raw_user_meta_data->>'phone', ''));
begin
  -- Link an existing legacy member first. This prevents duplicate profiles
  -- when an old member activates an email account.
  update public.members m
  set auth_id = new.id,
      email = lower(coalesce(new.email, m.email)),
      name = coalesce(nullif(v_name,''), m.name),
      phone = coalesce(nullif(v_phone,''), m.phone),
      is_member = true
  where m.auth_id is null
    and (
      (v_phone <> '' and regexp_replace(coalesce(m.phone,''),'[^0-9]','','g') = regexp_replace(v_phone,'[^0-9]','','g'))
      or (new.email is not null and lower(coalesce(m.email,'')) = lower(new.email))
    );

  if not found then
    insert into public.members (
      auth_id, name, phone, email, role, status, online, is_admin, is_member
    )
    values (
      new.id, nullif(v_name, ''), nullif(v_phone, ''), lower(new.email),
      'member', 'pending', false, false, true
    );
  end if;

  return new;
end;
$$;

-- 4. Install the Auth -> members trigger. It also links an existing legacy
-- member during activation instead of creating a duplicate profile.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_rihula on auth.users;
create trigger on_auth_user_created_rihula
after insert on auth.users
for each row execute function public.rihula_handle_new_auth_user();

-- 5. Link an already-registered legacy member to a new Auth account.
create or replace function public.activate_old_member(
  p_phone text,
  p_old_password text,
  p_email text,
  p_auth_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_member public.members%rowtype;
begin
  v_phone := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
  if left(v_phone,4) = '+254' then v_phone := '0' || substr(v_phone,5);
  elsif left(v_phone,3) = '254' then v_phone := '0' || substr(v_phone,4);
  end if;

  select * into v_member
  from public.members
  where regexp_replace(coalesce(phone::text,''),'[^0-9]','','g') = regexp_replace(v_phone,'[^0-9]','','g')
  limit 1;

  if v_member.id is null then
    return jsonb_build_object('success',false,'message','No member was found with that phone number.');
  end if;

  if v_member.password is distinct from p_old_password then
    return jsonb_build_object('success',false,'message','The old member password is incorrect.');
  end if;

  if v_member.auth_id is not null and v_member.auth_id <> p_auth_id then
    return jsonb_build_object('success',false,'message','This member is already linked to another login account.');
  end if;

  update public.members
  set auth_id = p_auth_id,
      email = lower(trim(p_email)),
      is_member = true
  where id = v_member.id;

  return jsonb_build_object('success',true,'message','Member activated successfully.');
exception
  when undefined_column then
    return jsonb_build_object('success',false,'message','The members table is missing auth_id, email, phone or password.');
  when others then
    return jsonb_build_object('success',false,'message',sqlerrm);
end;
$$;

revoke all on function public.activate_old_member(text,text,text,uuid) from public;
grant execute on function public.activate_old_member(text,text,text,uuid) to anon, authenticated;

-- 6. Admin helper now uses is_admin.
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
      and m.is_admin = true
      and lower(coalesce(m.status, 'active')) not in (
        'blocked', 'suspended', 'inactive'
      )
  );
$$;

-- 5. Members may read their own profile. Admins may read all profiles.
alter table public.members enable row level security;

drop policy if exists "Members read own profile" on public.members;

create policy "Members read own profile"
on public.members
for select
to authenticated
using (
  auth_id = auth.uid()
  or public.is_rihula_admin()
);

-- 6. Members may update their own profile. Admins may update all profiles.
drop policy if exists "Members update own profile" on public.members;

create policy "Members update own profile"
on public.members
for update
to authenticated
using (
  auth_id = auth.uid()
  or public.is_rihula_admin()
)
with check (
  auth_id = auth.uid()
  or public.is_rihula_admin()
);
