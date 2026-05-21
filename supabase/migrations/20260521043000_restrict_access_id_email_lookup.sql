-- The student-access-login Edge Function uses the service role to call this.
-- Browser clients should not be able to directly resolve Access IDs to emails.

revoke all on function public.lookup_email_by_access_id(text) from public;
revoke all on function public.lookup_email_by_access_id(text) from anon;
revoke all on function public.lookup_email_by_access_id(text) from authenticated;
grant execute on function public.lookup_email_by_access_id(text) to service_role;

notify pgrst, 'reload schema';
