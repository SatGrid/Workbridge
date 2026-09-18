import Link from 'next/link';
import { ArrowUpRight, MapPin, ArrowRight } from 'lucide-react';
import type { Job } from '@/lib/types';
import { money } from '@/lib/utils';
export function CompanyMark({ name, large = false }: { name: string; large?: boolean }) {
  const index = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  return (
    <span className={`company-mark mark-${index} ${large ? 'mark-large' : ''}`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
export function JobCard({ job }: { job: Job }) {
  return (
    <article className="job-card">
      <div className="job-card-top">
        <CompanyMark name={job.companies.name} />
        <div>
          <span className="company-name">{job.companies.name}</span>
          <span className="job-location">
            <MapPin size={13} />
            {job.location}
          </span>
        </div>
        <span className="job-kind">{job.category}</span>
      </div>
      <Link href={`/jobs/${job.id}`} className="job-title-link">
        <h3>{job.title}</h3>
        <ArrowUpRight size={19} />
      </Link>
      <div className="chips">
        <span>{job.workplace}</span>
        <span>{job.type}</span>
      </div>
      <div className="job-card-bottom">
        <span>
          <strong>
            {money(job.salary_min)} – {money(job.salary_max)}
          </strong>
          <small> / year</small>
        </span>
        <Link
          href={`/jobs/${job.id}`}
          className="round-link"
          aria-label={`View ${job.title} at ${job.companies.name}`}
        >
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}
