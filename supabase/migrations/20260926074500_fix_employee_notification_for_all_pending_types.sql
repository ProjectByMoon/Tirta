-- Ensure every new inactive Karyawan registration notifies HR/Admin/Super Admin.
-- The selected employment type (Tetap/Kontrak/Harian/Probation) is not the approval state.

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

notify pgrst, 'reload schema';
