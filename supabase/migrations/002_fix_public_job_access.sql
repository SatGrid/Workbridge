-- Allow public job listings without granting anonymous access to applications.
create or replace function public.has_applied(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.applications
    where job_id = target and applicant_id = auth.uid()
  );
$$;

drop policy if exists job_read on public.jobs;
create policy job_read
on public.jobs
for select
to anon, authenticated
using (
  public.visible_job(id)
  or public.owns_company(company_id)
  or public.active_role() = 'admin'
  or public.has_applied(id)
);
