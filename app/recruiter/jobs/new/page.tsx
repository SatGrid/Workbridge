import { requireProfile } from '@/lib/auth';
import { JobForm } from '@/components/job-form';
import Link from 'next/link';
export const metadata = { title: 'Post a job' };
export default async function NewJob() {
  const p = await requireProfile(['recruiter']);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Find your next great teammate.</h1>
          <p>A thoughtful job description makes a great first impression.</p>
        </div>
      </div>
      <section className="panel" style={{ maxWidth: 800 }}>
        {p.approved ? (
          <JobForm />
        ) : (
          <p className="notice">
            Your account is awaiting administrator approval.{' '}
            <Link href="/recruiter">Return to your workspace.</Link>
          </p>
        )}
      </section>
    </>
  );
}
