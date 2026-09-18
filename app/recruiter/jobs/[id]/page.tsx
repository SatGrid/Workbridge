import { requireProfile } from '@/lib/auth';
import { getJob } from '@/lib/data';
import { JobForm } from '@/components/job-form';
import { notFound } from 'next/navigation';
import { idSchema } from '@/lib/validation';
export const metadata = { title: 'Edit job' };
export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const p = await requireProfile(['recruiter', 'admin']);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const job = await getJob(id);
  if (!job || (p.role !== 'admin' && job.companies.owner_id !== p.id)) notFound();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Edit opportunity</h1>
          <p>
            {job.title} at {job.companies.name}
          </p>
        </div>
      </div>
      <section className="panel" style={{ maxWidth: 800 }}>
        <JobForm job={job} />
      </section>
    </>
  );
}
