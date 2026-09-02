-- RIHULA GALLERY ADD-ON
-- Additive only: does not alter or delete existing RIHULA tables.
-- Run this ONCE in the same Supabase project used by the website.

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'RIHULA Gallery',
  image_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

drop policy if exists "RIHULA gallery public read" on public.gallery_images;
create policy "RIHULA gallery public read"
on public.gallery_images
for select
to anon, authenticated
using (true);

drop policy if exists "RIHULA gallery admin insert" on public.gallery_images;
create policy "RIHULA gallery admin insert"
on public.gallery_images
for insert
to authenticated
with check (public.is_rihula_admin());

drop policy if exists "RIHULA gallery admin update" on public.gallery_images;
create policy "RIHULA gallery admin update"
on public.gallery_images
for update
to authenticated
using (public.is_rihula_admin())
with check (public.is_rihula_admin());

drop policy if exists "RIHULA gallery admin delete" on public.gallery_images;
create policy "RIHULA gallery admin delete"
on public.gallery_images
for delete
to authenticated
using (public.is_rihula_admin());

-- Public image bucket. Upload/delete is still restricted by policies below.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "RIHULA gallery storage public read" on storage.objects;
create policy "RIHULA gallery storage public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery');

drop policy if exists "RIHULA gallery storage admin insert" on storage.objects;
create policy "RIHULA gallery storage admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'gallery' and public.is_rihula_admin());

drop policy if exists "RIHULA gallery storage admin update" on storage.objects;
create policy "RIHULA gallery storage admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'gallery' and public.is_rihula_admin())
with check (bucket_id = 'gallery' and public.is_rihula_admin());

drop policy if exists "RIHULA gallery storage admin delete" on storage.objects;
create policy "RIHULA gallery storage admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gallery' and public.is_rihula_admin());
