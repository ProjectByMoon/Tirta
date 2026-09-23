-- Project by Tirta | Registration photo hardening
-- Registration must not allow anonymous uploads or public-read employee photos.
-- Photos are stored as private objects and referenced by storage path in karyawan.foto_url.

update storage.buckets
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'profile-photos';

-- Remove the legacy anonymous/public registration policy.
drop policy if exists "profile_photos_anon_insert" on storage.objects;
drop policy if exists "profile_photos_authenticated_insert" on storage.objects;
drop policy if exists "profile_photos_authenticated_select" on storage.objects;

create policy "profile_photos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (
    ((storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text)
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "profile_photos_authenticated_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-photos'
  and (
    public.is_hris_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);

create policy "profile_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or (storage.foldername(name))[2] = auth.uid()::text)
)
with check (
  bucket_id = 'profile-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or (storage.foldername(name))[2] = auth.uid()::text)
);

create policy "profile_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (public.is_hris_admin() or (storage.foldername(name))[1] = auth.uid()::text or (storage.foldername(name))[2] = auth.uid()::text)
);

notify pgrst, 'reload schema';
