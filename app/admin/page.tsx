import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Job, Application, Profile } from '@/lib/types';
import { ManagedJobs, ApplicationList } from '@/components/management';
import { ActionForm } from '@/components/forms';
import { manageUser } from '@/app/actions';
import Link from 'next/link';
export const metadata = { title: 'Admin workspace' };
export default async function Admin() {
  const me = await requireProfile(['admin']);
  const client = await createClient();
  const results = await Promise.all([
    client.from('profiles').select('*').order('created_at', { ascending: false }),
    client.from('jobs').select('*, companies(*)').order('created_at', { ascending: false }),
    client
      .from('applications')
      .select('*, jobs(*, companies(*)), profiles(*)')
      .order('created_at', { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  const users = results[0].data as Profile[],
    jobs = results[1].data as unknown as Job[],
    applications = results[2].data as unknown as Application[];
  const pending = users.filter((u) => u.role === 'recruiter' && !u.approved);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ADMIN WORKSPACE</div>
          <h1>The bigger picture.</h1>
          <p>Keep Workbridge running smoothly for everyone.</p>
        </div>
      </div>
      <div className="workspace-nav">
        <Link href="#users">People & approvals {pending.length > 0 && `(${pending.length})`}</Link>
        <Link href="#jobs">All jobs</Link>
        <Link href="#applications">All applications</Link>
      </div>
      <div className="stats">
        <div className="stat">
          <span>Members</span>
          <strong>{users.length}</strong>
        </div>
        <div className="stat">
          <span>Open jobs</span>
          <strong>{jobs.filter((j) => j.status === 'published').length}</strong>
        </div>
        <div className="stat">
          <span>Applications</span>
          <strong>{applications.length}</strong>
        </div>
      </div>
      <section className="panel" id="users">
        <h2>People & recruiter approvals</h2>
        {users.map((user) => (
          <article className="list-row" key={user.id}>
            <div className="row-main">
              <h3>
                {user.full_name}
                {user.id === me.id ? ' (you)' : ''}
              </h3>
              <p>
                {user.role} · {user.is_active ? 'Active' : 'Suspended'}
                {user.role === 'recruiter'
                  ? user.approved
                    ? ' · Approved'
                    : ' · Awaiting approval'
                  : ''}
              </p>
            </div>
            {user.id !== me.id && (
              <div className="row-actions">
                {user.role === 'recruiter' && !user.approved && (
                  <ActionForm action={manageUser} submit="Approve recruiter">
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="action" value="approve" />
                  </ActionForm>
                )}
                <ActionForm
                  action={manageUser}
                  submit={user.is_active ? 'Suspend' : 'Restore access'}
                  variant={user.is_active ? 'danger' : 'secondary'}
                  confirm={
                    user.is_active
                      ? 'Suspend this account? They will lose access to their workspace.'
                      : undefined
                  }
                >
                  <input type="hidden" name="id" value={user.id} />
                  <input
                    type="hidden"
                    name="action"
                    value={user.is_active ? 'suspend' : 'restore'}
                  />
                </ActionForm>
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="panel" id="jobs">
        <h2>All opportunities</h2>
        <ManagedJobs jobs={jobs} admin />
      </section>
      <section className="panel" id="applications">
        <h2>All applications</h2>
        <ApplicationList applications={applications} admin />
      </section>
    </>
  );
}
