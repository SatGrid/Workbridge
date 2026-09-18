import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { sampleJobs } from '../lib/sample.ts';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local for seeding.',
  );
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const roles = ['applicant', 'recruiter', 'admin'] as const;
const accounts: Record<string, { id: string; email: string; password: string }> = {};
for (const role of roles) {
  const email = `demo-${role}@workbridge.example`,
    password = randomBytes(18).toString('base64url');
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name:
        role === 'applicant'
          ? 'Alex Morgan'
          : role === 'recruiter'
            ? 'Jamie Chen'
            : 'Workbridge Admin',
      role: role === 'admin' ? 'applicant' : role,
    },
  });
  if (error)
    throw new Error(
      `Could not create ${email}: ${error.message}. Existing accounts are never reset. Remove any partially created demo accounts manually before retrying.`,
    );
  accounts[role] = { id: data.user.id, email, password };
  const { error: profileError } = await client
    .from('profiles')
    .update({ role, approved: true })
    .eq('id', data.user.id);
  if (profileError) throw profileError;
  console.log(`${role}: ${email} | Password: ${password}`);
}
const { data: company, error } = await client
  .from('companies')
  .insert({
    owner_id: accounts.recruiter.id,
    name: 'Layers',
    website: 'https://example.com',
    description: 'A fictional design and technology team for the Workbridge portfolio demo.',
  })
  .select('id')
  .single();
if (error) throw error;
const jobs = sampleJobs
  .slice(0, 3)
  .map(
    ({
      title,
      location,
      workplace,
      type,
      category,
      salary_min,
      salary_max,
      description,
      requirements,
    }) => ({
      company_id: company.id,
      title,
      location,
      workplace,
      type,
      category,
      salary_min,
      salary_max,
      description: description.replace(/Orbit|Forma/g, 'Layers'),
      requirements,
    }),
  );
const { error: jobError } = await client.from('jobs').insert(jobs);
if (jobError) throw jobError;
console.log('Demo accounts and three jobs created. Keep the administrator password private.');
