-- Allow admins to manage employee leave requests
drop policy if exists "hris_leave_admin_all" on public.hris_employee_leave_requests;
create policy "hris_leave_admin_all"
on public.hris_employee_leave_requests
for all
to authenticated
using (public.hr_is_admin())
with check (public.hr_is_admin());
