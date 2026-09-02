-- RIHULA PROFILE PHOTO STORAGE FIX
-- Run this in the CURRENT RIHULA Supabase SQL Editor.
--
-- Fixes the "Photo could not be uploaded / Check Storage permissions" error.
-- The frontend uploads to:
--   profile-pictures/members/<public.members.id>/<timestamp>.<extension>
--
-- This script:
-- 1. Creates the profile-pictures bucket if it does not exist.
-- 2. Makes the bucket public so getPublicUrl() works for profile images.
-- 3. Allows an authenticated member to upload only inside their own folder.
-- 4. Allows members to update/delete files in their own folder.
--
-- It does NOT disable RLS globally.

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update
set public = true;

alter table storage.objects enable row level security;

drop policy if exists "RIHULA profile photos insert own folder" on storage.objects;
create policy "RIHULA profile photos insert own folder"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = 'members'
    and (storage.foldername(name))[2] = (
        select m.id::text
        from public.members m
        where m.auth_id = auth.uid()
        limit 1
    )
);

drop policy if exists "RIHULA profile photos update own folder" on storage.objects;
create policy "RIHULA profile photos update own folder"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = 'members'
    and (storage.foldername(name))[2] = (
        select m.id::text
        from public.members m
        where m.auth_id = auth.uid()
        limit 1
    )
)
with check (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = 'members'
    and (storage.foldername(name))[2] = (
        select m.id::text
        from public.members m
        where m.auth_id = auth.uid()
        limit 1
    )
);

drop policy if exists "RIHULA profile photos delete own folder" on storage.objects;
create policy "RIHULA profile photos delete own folder"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = 'members'
    and (storage.foldername(name))[2] = (
        select m.id::text
        from public.members m
        where m.auth_id = auth.uid()
        limit 1
    )
);

-- No SELECT policy is required for the public bucket above.
-- Public URLs can be read by visitors while INSERT/UPDATE/DELETE remain
-- protected by the policies above.

-- Optional verification:
-- select id, name, public from storage.buckets where id = 'profile-pictures';
