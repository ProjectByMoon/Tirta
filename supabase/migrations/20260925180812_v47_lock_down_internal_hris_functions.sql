revoke execute on function public.hris_audit(text,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.hris_audit_safe_row() from public, anon, authenticated;
revoke execute on function public.hris_record_approval_history() from public, anon, authenticated;
revoke execute on function public.hris_require_permission(text) from public, anon, authenticated;
revoke execute on function public.hris_v13_decide_approval(uuid,text,text) from public, anon, authenticated;
revoke execute on function public.hris_v13_notify_approval() from public, anon, authenticated;

grant execute on function public.hris_submit_approval(text,text) to authenticated;
grant execute on function public.hris_decide_approval(uuid,text,text) to authenticated;
