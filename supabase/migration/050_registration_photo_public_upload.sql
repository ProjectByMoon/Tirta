-- Project by Tirta | Registration photo upload policy
-- Anonymous upload is allowed only for the short-lived registration/ prefix.
-- The bucket remains private-read; normal employee photos are never public-read.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  2097152,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_anon_insert" on storage.objects;
drop policy if exists "profile_photos_registration_anon_insert" on storage.objects;
create policy "profile_photos_registration_anon_insert"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'registration'
);

-- Preserve authenticated employee/admin writes for existing avatar paths.
drop policy if exists "profile_photos_authenticated_insert" on storage.objects;
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

-- Registration objects are intentionally not selectable by anon/public users.
-- The auth trigger stores the registration path on karyawan when the account is created.
create or replace function public.moonhr_create_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1));
  v_phone text := nullif(new.raw_user_meta_data->>'no_telp','');
  v_address text := nullif(new.raw_user_meta_data->>'alamat_rumah','');
  v_birth date := nullif(new.raw_user_meta_data->>'tanggal_lahir','')::date;
  v_photo_url text := nullif(new.raw_user_meta_data->>'foto_url','');
  v_requested_id text := nullif(upper(btrim(new.raw_user_meta_data->>'id_karyawan')),'');
  v_id text := coalesce(v_requested_id, 'REG-' || upper(substr(replace(new.id::text,'-',''),1,8)));
begin
  if exists (select 1 from public.karyawan where upper(btrim(id_karyawan)) = v_id) then
    if exists (select 1 from public.karyawan where auth_user_id = new.id) then
      update public.karyawan
      set foto_url = coalesce(v_photo_url, foto_url)
      where auth_user_id = new.id;
      return new;
    end if;
    raise exception 'ID Karyawan % sudah digunakan.', v_id;
  end if;

  insert into public.karyawan
    (id,id_karyawan,nama,email,no_telp,alamat_rumah,tanggal_lahir,foto_url,role,status_aktif,status_karyawan,auth_user_id)
  values
    (gen_random_uuid(),v_id,v_name,new.email,v_phone,v_address,v_birth,v_photo_url,'karyawan',false,'Menunggu Verifikasi',new.id)
  on conflict (email) do update set
    nama=excluded.nama,
    no_telp=excluded.no_telp,
    alamat_rumah=excluded.alamat_rumah,
    tanggal_lahir=excluded.tanggal_lahir,
    foto_url=coalesce(excluded.foto_url, public.karyawan.foto_url),
    auth_user_id=excluded.auth_user_id;

  return new;
end;
$$;

-- A registration object is only an internal storage reference; no public SELECT policy is created.
notify pgrst, 'reload schema';
