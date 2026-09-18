import { requireProfile, home } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ActionForm, Field, TextArea } from '@/components/forms';
import { saveProfile, uploadResume, saveCompany } from '@/app/actions';
import Link from 'next/link';
export const metadata = { title: 'Your profile' };
export default async function ProfilePage() {
  const profile = await requireProfile();
  const client = await createClient();
  const { data: company } =
    profile.role === 'recruiter'
      ? await client.from('companies').select('*').eq('owner_id', profile.id).maybeSingle()
      : { data: null };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A little more about you.</h1>
          <p>Keep your profile current and ready for your next connection.</p>
        </div>
        <Link href={home(profile.role)} className="button button-secondary">
          Your workspace
        </Link>
      </div>
      <div className="profile-columns">
        <section className="panel">
          <h2>Your profile</h2>
          <ActionForm action={saveProfile}>
            <Field
              label="Full name"
              name="full_name"
              defaultValue={profile.full_name}
              required
              maxLength={80}
            />
            <Field
              label="Headline"
              name="headline"
              defaultValue={profile.headline}
              placeholder="Product designer with a love for thoughtful details"
              maxLength={140}
            />
            <Field
              label="Location"
              name="location"
              defaultValue={profile.location}
              maxLength={100}
            />
            <TextArea label="About you" name="bio" defaultValue={profile.bio} />
          </ActionForm>
        </section>
        <div>
          {profile.role === 'applicant' && (
            <section className="panel">
              <h2>Your resume</h2>
              <p className="muted" style={{ marginBottom: 20 }}>
                Upload a PDF, up to 5 MB. Recruiters can access it only after you apply to one of
                their jobs.
              </p>
              {profile.resume_path && (
                <a
                  href={`/api/resume/${profile.id}`}
                  className="button button-secondary"
                  style={{ marginBottom: 20 }}
                >
                  Download current resume
                </a>
              )}
              <ActionForm
                action={uploadResume}
                submit={profile.resume_path ? 'Replace resume' : 'Upload resume'}
              >
                <label className="field">
                  <span>Resume PDF</span>
                  <input name="resume" type="file" accept="application/pdf" required />
                </label>
              </ActionForm>
            </section>
          )}
          {profile.role === 'recruiter' && (
            <section className="panel">
              <h2>Your company</h2>
              <ActionForm action={saveCompany}>
                <Field
                  label="Company name"
                  name="name"
                  defaultValue={company?.name}
                  required
                  maxLength={100}
                />
                <Field
                  label="Website (optional)"
                  name="website"
                  type="url"
                  defaultValue={company?.website}
                  placeholder="https://yourcompany.com"
                />
                <TextArea
                  label="About the company"
                  name="description"
                  defaultValue={company?.description}
                />
              </ActionForm>
            </section>
          )}
          <section className="panel">
            <h2>Account access</h2>
            <p className="muted">Account type: {profile.role}</p>
            {profile.role === 'recruiter' && (
              <p className="notice" style={{ marginTop: 16 }}>
                {profile.approved
                  ? 'Your recruiter account is approved. You can publish jobs.'
                  : 'Your recruiter account is awaiting administrator approval.'}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
