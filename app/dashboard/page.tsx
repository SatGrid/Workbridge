import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CompanyMark } from '@/components/job-card';
import { date } from '@/lib/utils';
import type { Application } from '@/lib/types';
export const metadata = { title: 'My applications' };
export default async function Dashboard() {
  const profile = await requireProfile(['applicant']);
  const client = await createClient();
  const { data, error } = await client
    .from('applications')
    .select('*, jobs(*, companies(*))')
    .eq('applicant_id', profile.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const applications = data as unknown as Application[];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>Welcome back, {profile.full_name.split(' ')[0]}.</h1>
          <p>Every application is a step toward what’s next.</p>
        </div>
        <Link className="button button-primary" href="/">
          Explore jobs ↗
        </Link>
      </div>
      <div className="workspace-nav">
        <Link href="/dashboard">My applications</Link>
        <Link href="/profile">Profile & resume</Link>
      </div>
      <div className="stats">
        <div className="stat">
          <span>Applications sent</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="stat">
          <span>Shortlisted</span>
          <strong>{applications.filter((a) => a.status === 'shortlisted').length}</strong>
        </div>
        <div className="stat">
          <span>Hired</span>
          <strong>{applications.filter((a) => a.status === 'hired').length}</strong>
        </div>
      </div>
      {!profile.resume_path && (
        <p className="notice" style={{ marginBottom: 24 }}>
          Make your profile application-ready. <Link href="/profile">Upload your resume →</Link>
        </p>
      )}
      <section className="panel">
        <h2>My applications</h2>
        {applications.length ? (
          applications.map((a) => (
            <article className="list-row" key={a.id}>
              <CompanyMark name={a.jobs.companies.name} />
              <div className="row-main">
                <h3>
                  <Link href={`/jobs/${a.job_id}`}>{a.jobs.title}</Link>
                </h3>
                <p>
                  {a.jobs.companies.name} · Applied {date(a.created_at)}
                </p>
              </div>
              <span className={`badge badge-${a.status}`}>{a.status}</span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <BriefcaseBusiness size={30} />
            <h3>Your next chapter starts here</h3>
            <p>Find a role you love and your applications will appear here.</p>
            <Link className="button button-secondary" href="/">
              Find a job
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
