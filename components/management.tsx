import Link from 'next/link';
import { ActionForm } from './forms';
import { updateApplication, changeJobState, deleteRecord } from '@/app/actions';
import type { Application, Job } from '@/lib/types';
import { date } from '@/lib/utils';
export function ApplicationList({
  applications,
  admin = false,
}: {
  applications: Application[];
  admin?: boolean;
}) {
  if (!applications.length)
    return (
      <div className="empty-state">
        <h3>No applications yet</h3>
        <p>Applications will appear here as candidates apply to your jobs.</p>
      </div>
    );
  return applications.map((a) => (
    <article className="application-card" key={a.id}>
      <header>
        <div>
          <h3>{a.profiles.full_name}</h3>
          <p className="muted">
            {a.jobs.title} · {date(a.created_at)}
          </p>
        </div>
        <span className={`badge badge-${a.status}`}>{a.status}</span>
        {a.profiles.resume_path && (
          <a className="button button-secondary" href={`/api/resume/${a.applicant_id}`}>
            Resume ↗
          </a>
        )}
      </header>
      {a.profiles.headline && <p className="muted">{a.profiles.headline}</p>}
      {a.cover_note && <p className="cover-note">{a.cover_note}</p>}
      <div className="row-actions">
        <ActionForm
          action={updateApplication}
          className="compact-form"
          submit="Update status"
          variant="secondary"
        >
          <input type="hidden" name="id" value={a.id} />
          <label className="sr-only" htmlFor={`status-${a.id}`}>
            Application status for {a.profiles.full_name}
          </label>
          <select name="status" id={`status-${a.id}`} defaultValue={a.status}>
            {['applied', 'shortlisted', 'rejected', 'hired'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </ActionForm>
        {admin && (
          <ActionForm
            action={deleteRecord}
            submit="Delete"
            variant="danger"
            confirm="Delete this application permanently?"
          >
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="table" value="applications" />
          </ActionForm>
        )}
      </div>
    </article>
  ));
}
export function ManagedJobs({ jobs, admin = false }: { jobs: Job[]; admin?: boolean }) {
  if (!jobs.length)
    return (
      <div className="empty-state">
        <h3>A new opportunity starts with you</h3>
        <p>Your published jobs will appear here.</p>
      </div>
    );
  return jobs.map((job) => (
    <article className="list-row" key={job.id}>
      <div className="row-main">
        <h3>
          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
        </h3>
        <p>
          {job.companies.name} · {job.location} · {job.type}
        </p>
      </div>
      <span className={`badge badge-${job.status}`}>{job.status}</span>
      <div className="row-actions">
        <Link className="button button-secondary" href={`/recruiter/jobs/${job.id}`}>
          Edit
        </Link>
        <ActionForm
          action={changeJobState}
          submit={job.status === 'published' ? 'Close job' : 'Reopen'}
          variant="secondary"
        >
          <input type="hidden" name="id" value={job.id} />
          <input
            type="hidden"
            name="status"
            value={job.status === 'published' ? 'closed' : 'published'}
          />
        </ActionForm>
        {admin && (
          <ActionForm
            action={deleteRecord}
            submit="Delete"
            variant="danger"
            confirm="Delete this job and all its applications permanently?"
          >
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="table" value="jobs" />
          </ActionForm>
        )}
      </div>
    </article>
  ));
}
