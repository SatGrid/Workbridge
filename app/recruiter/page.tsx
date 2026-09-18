import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Job, Application } from '@/lib/types';
import { ManagedJobs, ApplicationList } from '@/components/management';
import Link from 'next/link';
export const metadata = { title: 'Recruiter workspace' };
export default async function Recruiter() {
  const profile = await requireProfile(['recruiter']);
  const client = await createClient();
  const { data: company, error: companyError } = await client
    .from('companies')
    .select('id')
    .eq('owner_id', profile.id)
    .maybeSingle();
  if (companyError) throw companyError;
  const { data: jobData, error: jobError } = company
    ? await client
        .from('jobs')
        .select('*, companies(*)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (jobError) throw jobError;
  const jobs = jobData as unknown as Job[];
  const ids = jobs.map((j) => j.id);
  const { data: appData, error: appError } = ids.length
    ? await client
        .from('applications')
        .select('*, jobs(*, companies(*)), profiles(*)')
        .in('job_id', ids)
        .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (appError) throw appError;
  const applications = appData as unknown as Application[];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RECRUITER WORKSPACE</div>
          <h1>Great teams start here.</h1>
          <p>Your opportunities, your applicants, all in one place.</p>
        </div>
        {profile.approved && company && (
          <Link className="button button-primary" href="/recruiter/jobs/new">
            Post a job +
          </Link>
        )}
      </div>
      <div className="workspace-nav">
        <Link href="#jobs">Your jobs</Link>
        <Link href="#applicants">Applicants</Link>
        <Link href="/profile">Company & profile</Link>
      </div>
      {!profile.approved && (
        <p className="notice" style={{ marginBottom: 24 }}>
          Your account is waiting for administrator approval. You can complete your company profile
          while you wait.
        </p>
      )}
      {!company && (
        <p className="notice" style={{ marginBottom: 24 }}>
          <Link href="/profile">Create your company profile</Link> before posting your first job.
        </p>
      )}
      <div className="stats">
        <div className="stat">
          <span>Open jobs</span>
          <strong>{jobs.filter((j) => j.status === 'published').length}</strong>
        </div>
        <div className="stat">
          <span>Applications</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="stat">
          <span>Shortlisted</span>
          <strong>{applications.filter((a) => a.status === 'shortlisted').length}</strong>
        </div>
      </div>
      <section className="panel" id="jobs">
        <h2>Your opportunities</h2>
        <ManagedJobs jobs={jobs} />
      </section>
      <section className="panel" id="applicants">
        <h2>Meet your applicants</h2>
        <ApplicationList applications={applications} />
      </section>
    </>
  );
}
