-- Project by Tirta | Employee self-registration workflow
-- Keeps Auth -> karyawan -> HR notification -> dashboard approval in one flow.

-- 1. Auth user -> complete pending employee profile.
create or replace function public.moonhr_create_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'nama'), ''),
    split_part(new.email, '@', 1)
  );
  v_phone text := nullif(btrim(new.raw_user_meta_data->>'no_telp'), '');
  v_address text := nullif(btrim(new.raw_user_meta_data->>'alamat_rumah'), '');
  v_birth date := nullif(new.raw_user_meta_data->>'tanggal_lahir', '')::date;
  v_requested_id text := nullif(upper(btrim(new.raw_user_meta_data->>'id_karyawan')), '');
  v_id text := coalesce(
    v_requested_id,
    'REG-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
  );
  v_nik text := nullif(btrim(new.raw_user_meta_data->>'nik_ktp'), '');
  v_tempat_lahir text := nullif(btrim(new.raw_user_meta_data->>'tempat_lahir'), '');
  v_jenis_kelamin text := nullif(btrim(new.raw_user_meta_data->>'jenis_kelamin'), '');
  v_status_pernikahan text := nullif(btrim(new.raw_user_meta_data->>'status_pernikahan'), '');
  v_nama_ibu text := nullif(btrim(new.raw_user_meta_data->>'nama_ibu_kandung'), '');
  v_departemen text := nullif(btrim(new.raw_user_meta_data->>'departemen'), '');
  v_jabatan text := nullif(btrim(new.raw_user_meta_data->>'jabatan'), '');
  v_status_karyawan text := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'status_karyawan'), ''),
    'Menunggu Verifikasi'
  );
  v_tanggal_masuk date := nullif(new.raw_user_meta_data->>'tanggal_masuk', '')::date;
  v_gaji_pokok numeric := coalesce(
    nullif(new.raw_user_meta_data->>'gaji_pokok', '')::numeric,
    0
  );
  v_bank_name text := nullif(btrim(new.raw_user_meta_data->>'bank_name'), '');
  v_bank_account text := nullif(btrim(new.raw_user_meta_data->>'bank_account'), '');
  v_foto_url text := nullif(btrim(new.raw_user_meta_data->>'foto_url'), '');
begin
  if exists (
    select 1
    from public.karyawan
    where upper(btrim(id_karyawan)) = v_id
      and auth_user_id is distinct from new.id
  ) then
    raise exception 'ID Karyawan % sudah digunakan.', v_id;
  end if;

  insert into public.karyawan (
    id,
    id_karyawan,
    nama,
    email,
    no_telp,
    alamat_rumah,
    tanggal_lahir,
    nik_ktp,
    tempat_lahir,
    jenis_kelamin,
    status_pernikahan,
    nama_ibu_kandung,
    departemen,
    jabatan,
    status_karyawan,
    tanggal_masuk,
    gaji_pokok,
    bank_name,
    bank_account,
    foto_url,
    role,
    status_aktif,
    auth_user_id,
    email_terverifikasi
  )
  values (
    gen_random_uuid(),
    v_id,
    v_name,
    new.email,
    v_phone,
    v_address,
    v_birth,
    v_nik,
    v_tempat_lahir,
    v_jenis_kelamin,
    v_status_pernikahan,
    v_nama_ibu,
    v_departemen,
    v_jabatan,
    v_status_karyawan,
    v_tanggal_masuk,
    v_gaji_pokok,
    v_bank_name,
    v_bank_account,
    v_foto_url,
    'karyawan',
    false,
    new.id,
    (new.email_confirmed_at is not null)
  )
  on conflict (email)
  do update set
    nama = excluded.nama,
    no_telp = excluded.no_telp,
    alamat_rumah = excluded.alamat_rumah,
    tanggal_lahir = excluded.tanggal_lahir,
    nik_ktp = excluded.nik_ktp,
    tempat_lahir = excluded.tempat_lahir,
    jenis_kelamin = excluded.jenis_kelamin,
    status_pernikahan = excluded.status_pernikahan,
    nama_ibu_kandung = excluded.nama_ibu_kandung,
    departemen = excluded.departemen,
    jabatan = excluded.jabatan,
    status_karyawan = excluded.status_karyawan,
    tanggal_masuk = excluded.tanggal_masuk,
    gaji_pokok = excluded.gaji_pokok,
    bank_name = excluded.bank_name,
    bank_account = excluded.bank_account,
    foto_url = coalesce(excluded.foto_url, public.karyawan.foto_url),
    auth_user_id = excluded.auth_user_id,
    email_terverifikasi = excluded.email_terverifikasi;

  return new;
end;
$$;

revoke all on function public.moonhr_create_employee_profile() from public, anon, authenticated;
drop trigger if exists moonhr_auth_employee_profile on auth.users;
create trigger moonhr_auth_employee_profile
after insert on auth.users
for each row execute function public.moonhr_create_employee_profile();

-- 2. Only pending self-registrations generate HR notifications.
create or replace function public.hris_notify_new_employee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status_aktif = false
     and lower(coalesce(new.role, 'karyawan')) = 'karyawan' then
    insert into public.hris_notifications (recipient_email, type, title, message, link)
    select u.email,
           'employee',
           'Karyawan Baru',
           'Karyawan baru terdaftar: ' || coalesce(new.nama, new.id_karyawan, 'Tanpa nama'),
           '#/employee-new'
    from public.hris_users u
    where u.status = 'Aktif'
      and u.role in ('Admin','HRD','Super Admin');
  end if;
  return new;
end;
$$;

revoke all on function public.hris_notify_new_employee() from public, anon, authenticated;
drop trigger if exists trg_notify_new_employee on public.karyawan;
create trigger trg_notify_new_employee
after insert on public.karyawan
for each row
when (
  new.status_aktif = false
  and lower(coalesce(new.role, 'karyawan')) = 'karyawan'
)
execute function public.hris_notify_new_employee();

-- 3. Repair existing Karyawan accounts that were created before the bridge was reliable.
-- They become normal pending registrations and can be handled from Dashboard HR.
do $$
begin
  insert into public.karyawan (
    id,
    id_karyawan,
    nama,
    email,
    no_telp,
    alamat_rumah,
    tanggal_lahir,
    nik_ktp,
    tempat_lahir,
    jenis_kelamin,
    status_pernikahan,
    nama_ibu_kandung,
    departemen,
    jabatan,
    status_karyawan,
    tanggal_masuk,
    gaji_pokok,
    foto_url,
    role,
    status_aktif,
    auth_user_id,
    email_terverifikasi,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    'REG-' || upper(substr(replace(u.id::text, '-', ''), 1, 8)),
    coalesce(nullif(btrim(u.raw_user_meta_data->>'nama'), ''), split_part(u.email, '@', 1)),
    u.email,
    nullif(btrim(u.raw_user_meta_data->>'no_telp'), ''),
    nullif(btrim(u.raw_user_meta_data->>'alamat_rumah'), ''),
    nullif(u.raw_user_meta_data->>'tanggal_lahir', '')::date,
    nullif(btrim(u.raw_user_meta_data->>'nik_ktp'), ''),
    nullif(btrim(u.raw_user_meta_data->>'tempat_lahir'), ''),
    nullif(btrim(u.raw_user_meta_data->>'jenis_kelamin'), ''),
    nullif(btrim(u.raw_user_meta_data->>'status_pernikahan'), ''),
    nullif(btrim(u.raw_user_meta_data->>'nama_ibu_kandung'), ''),
    nullif(btrim(u.raw_user_meta_data->>'departemen'), ''),
    nullif(btrim(u.raw_user_meta_data->>'jabatan'), ''),
    'Menunggu Verifikasi',
    nullif(u.raw_user_meta_data->>'tanggal_masuk', '')::date,
    coalesce(nullif(u.raw_user_meta_data->>'gaji_pokok', '')::numeric, 0),
    nullif(btrim(u.raw_user_meta_data->>'foto_url'), ''),
    'karyawan',
    false,
    u.id,
    (u.email_confirmed_at is not null),
    u.created_at,
    now()
  from auth.users u
  join public.hris_users h
    on lower(h.email) = lower(u.email)
   and h.role = 'Karyawan'
  left join public.karyawan k
    on k.auth_user_id = u.id
  where k.id is null
  on conflict (auth_user_id) do nothing;
end;
$$;

notify pgrst, 'reload schema';
