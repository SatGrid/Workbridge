import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import { getJob } from '@/lib/data';
import { currentProfile } from '@/lib/auth';
import { createClient, configured } from '@/lib/supabase/server';
import { CompanyMark } from '@/components/job-card';
import { ActionForm, TextArea } from '@/components/forms';
import { applyForJob } from '@/app/actions';
import { money, date } from '@/lib/utils';
import { idSchema } from '@/lib/validation';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return { title: 'Job not found' };
  const job = await getJob(id);
  return { title: job ? `${job.title} at ${job.companies.name}` : 'Job not found' };
}
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const job = await getJob(id);
  if (!job) notFound();
  const profile = await currentProfile();
  let applied = false;
  if (profile?.role === 'applicant' && configured()) {
    const client = await createClient();
    const { data, error } = await client
      .from('applications')
      .select('id')
      .eq('job_id', id)
      .eq('applicant_id', profile.id)
      .maybeSingle();
    if (error) throw error;
    applied = Boolean(data);
  }
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        Back to opportunities
      </Link>
      <div className="detail-layout">
        <article className="panel">
          <div className="detail-title">
            <CompanyMark name={job.companies.name} large />
            <div>
              <p>
                {job.companies.name} · {job.category}
              </p>
              <h1>{job.title}</h1>
            </div>
          </div>
          <div className="detail-meta">
            <span>
              <MapPin size={15} />
              {job.location} · {job.workplace}
            </span>
            <span>
              <BriefcaseBusiness size={15} />
              {job.type}
            </span>
            <span>
              <CalendarDays size={15} />
              {date(job.created_at)}
            </span>
          </div>
          <section className="prose">
            <h2>About the opportunity</h2>
            {job.description}
          </section>
          <section className="prose">
            <h2>What you’ll bring</h2>
            {job.requirements}
          </section>
        </article>
        <aside className="detail-aside">
          <section className="panel">
            <span className="small-label">Annual salary · INR</span>
            <p className="salary">
              {money(job.salary_min)} – {money(job.salary_max)}
            </p>
            <p className="muted">
              {job.type} · {job.workplace}
            </p>
            {job.status === 'closed' ? (
              <p className="notice">Applications for this role are closed.</p>
            ) : applied ? (
              <p className="notice notice-success">
                You’ve applied to this role. <Link href="/dashboard">Track your application</Link>.
              </p>
            ) : profile?.role === 'applicant' ? (
              <ActionForm action={applyForJob} submit="Send application">
                <input type="hidden" name="job_id" value={job.id} />
                <TextArea
                  label="A short introduction (optional)"
                  name="cover_note"
                  placeholder="What makes this opportunity a good fit?"
                />
                {!profile.resume_path && (
                  <p className="notice">
                    <Link href="/profile">Upload a resume</Link> before applying.
                  </p>
                )}
              </ActionForm>
            ) : profile ? (
              <p className="notice">Sign in with an applicant account to apply.</p>
            ) : (
              <div className="form">
                <Link className="button button-primary" href="/login">
                  Sign in to apply
                </Link>
                <p className="muted">Your next chapter could start here.</p>
              </div>
            )}
          </section>
          <section className="panel">
            <h2>About {job.companies.name}</h2>
            <p className="muted">
              {job.companies.description || 'A team looking for its next great teammate.'}
            </p>
            {configured() && /^https?:\/\//.test(job.companies.website) && (
              <a
                className="back-link"
                href={job.companies.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit company website ↗
              </a>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
