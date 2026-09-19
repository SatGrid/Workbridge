-- Workbridge: one shared database, enforced role and ownership boundaries.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check (char_length(full_name) between 2 and 80),
 role text not null default 'applicant' check (role in ('applicant','recruiter','admin')),
 approved boolean not null default false, is_active boolean not null default true,
 headline text not null default '', location text not null default '', bio text not null default '',
 resume_path text, created_at timestamptz not null default now(),
 check (char_length(headline)<=140 and char_length(location)<=100 and char_length(bio)<=2000),
 check (resume_path is null or resume_path like id::text || '/%')
);
create table public.companies (
 id uuid primary key default gen_random_uuid(), owner_id uuid unique not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 2 and 100), website text not null default '', description text not null default ''
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 100), location text not null check(char_length(location) between 2 and 100),
 workplace text not null check(workplace in ('Remote','Hybrid','On-site')),
 type text not null check(type in ('Full-time','Part-time','Contract','Internship')),
 category text not null check(category in ('Engineering','Design','Product','Marketing','Operations')),
 salary_min integer not null check(salary_min>=0), salary_max integer not null check(salary_max>=salary_min and salary_max<=10000000),
 description text not null check(char_length(description) between 30 and 8000), requirements text not null check(char_length(requirements) between 10 and 5000),
 status text not null default 'published' check(status in ('published','closed')), created_at timestamptz not null default now()
);
create table public.applications (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 cover_note text not null default '' check(char_length(cover_note)<=2000),
 status text not null default 'applied' check(status in ('applied','shortlisted','rejected','hired')),
 created_at timestamptz not null default now(), unique(job_id,applicant_id)
);
create index jobs_company_idx on public.jobs(company_id);
create index jobs_status_created_idx on public.jobs(status,created_at desc);
create index applications_applicant_idx on public.applications(applicant_id);
create index applications_job_idx on public.applications(job_id);

create function public.active_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id = auth.uid() and is_active;
$$;
create function public.is_approved_recruiter() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='recruiter' and approved and is_active);
$$;
create function public.owns_company(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.companies where id=target and owner_id=auth.uid()) and public.active_role()='recruiter';
$$;
create function public.owns_job(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.jobs j join public.companies c on c.id=j.company_id where j.id=target and c.owner_id=auth.uid()) and public.active_role()='recruiter';
$$;
create function public.visible_job(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.jobs j join public.companies c on c.id=j.company_id join public.profiles p on p.id=c.owner_id
 where j.id=target and j.status='published' and p.approved and p.is_active);
$$;
create function public.has_applied(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.applications where job_id=target and applicant_id=auth.uid());
$$;
create function public.can_read_profile(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select target=auth.uid() or public.active_role()='admin' or (public.active_role()='recruiter' and exists(
 select 1 from public.applications a join public.jobs j on j.id=a.job_id join public.companies c on c.id=j.company_id where a.applicant_id=target and c.owner_id=auth.uid()));
$$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 insert into public.profiles(id,full_name,role) values(new.id, left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'New member'),80),
 case when new.raw_user_meta_data->>'role'='recruiter' then 'recruiter' else 'applicant' end);
 return new;
 end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
create policy profile_read on public.profiles for select to authenticated using (public.can_read_profile(id));
create policy profile_edit on public.profiles for update to authenticated using (id=auth.uid() and public.active_role() is not null) with check(id=auth.uid());
create policy company_read on public.companies for select to anon,authenticated using(true);
create policy company_create on public.companies for insert to authenticated with check(owner_id=auth.uid() and public.active_role()='recruiter');
create policy company_edit on public.companies for update to authenticated using(owner_id=auth.uid() and public.active_role()='recruiter') with check(owner_id=auth.uid());
create policy job_read on public.jobs for select to anon,authenticated using(public.visible_job(id) or public.owns_company(company_id) or public.active_role()='admin' or public.has_applied(id));
create policy job_create on public.jobs for insert to authenticated with check(public.is_approved_recruiter() and exists(select 1 from public.companies c where c.id=company_id and c.owner_id=auth.uid()));
create policy job_edit on public.jobs for update to authenticated using((public.owns_job(id) and public.is_approved_recruiter()) or public.active_role()='admin') with check((public.owns_job(id) and public.is_approved_recruiter()) or public.active_role()='admin');
create policy job_delete on public.jobs for delete to authenticated using(public.active_role()='admin');
create policy application_read on public.applications for select to authenticated using((applicant_id=auth.uid() and public.active_role()='applicant') or public.owns_job(job_id) or public.active_role()='admin');
create policy application_create on public.applications for insert to authenticated with check(applicant_id=auth.uid() and public.active_role()='applicant' and status='applied' and public.visible_job(job_id) and exists(select 1 from public.profiles where id=auth.uid() and resume_path is not null));
create policy application_review on public.applications for update to authenticated using((public.owns_job(job_id) and public.is_approved_recruiter()) or public.active_role()='admin') with check((public.owns_job(job_id) and public.is_approved_recruiter()) or public.active_role()='admin');
create policy application_delete on public.applications for delete to authenticated using(public.active_role()='admin');

-- Column grants prevent role escalation and reassigning records through the public API.
revoke all on public.profiles,public.companies,public.jobs,public.applications from anon,authenticated;
grant select on public.jobs,public.companies to anon;
grant select on public.profiles,public.companies,public.jobs,public.applications to authenticated;
grant update(full_name,headline,location,bio,resume_path) on public.profiles to authenticated;
grant insert(owner_id,name,website,description),update(name,website,description) on public.companies to authenticated;
grant insert(company_id,title,location,workplace,type,category,salary_min,salary_max,description,requirements) on public.jobs to authenticated;
grant update(title,location,workplace,type,category,salary_min,salary_max,description,requirements,status),delete on public.jobs to authenticated;
grant insert(job_id,applicant_id,cover_note),update(status),delete on public.applications to authenticated;

create function public.manage_user(target uuid, action text) returns void language plpgsql security definer set search_path = '' as $$
 begin
 if public.active_role() is distinct from 'admin' then raise exception 'Administrator access required'; end if;
 if target=auth.uid() then raise exception 'You cannot change your own administrative access'; end if;
 if action='approve' then update public.profiles set approved=true where id=target and role='recruiter';
 elsif action='suspend' then update public.profiles set is_active=false where id=target;
 elsif action='restore' then update public.profiles set is_active=true where id=target;
 else raise exception 'Unknown action'; end if;
 end;
$$;
revoke execute on function public.manage_user(uuid,text) from public,anon;
grant execute on function public.manage_user(uuid,text) to authenticated;
revoke execute on function public.handle_new_user() from public,anon,authenticated;

-- Resumes are private PDFs. Only their owner, an associated recruiter, or an admin may read them.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('resumes','resumes',false,5242880,array['application/pdf']);
create policy resume_read on storage.objects for select to authenticated using(bucket_id='resumes' and public.active_role() is not null and exists(select 1 from public.profiles p where p.resume_path=name and public.can_read_profile(p.id)));
create policy resume_upload on storage.objects for insert to authenticated with check(bucket_id='resumes' and (storage.foldername(name))[1]=auth.uid()::text and public.active_role()='applicant');
create policy resume_remove on storage.objects for delete to authenticated using(bucket_id='resumes' and (storage.foldername(name))[1]=auth.uid()::text and public.active_role()='applicant');




