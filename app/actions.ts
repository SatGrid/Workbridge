'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, configured } from '@/lib/supabase/server';
import { requireProfile, home } from '@/lib/auth';
import {
  authSchema,
  profileSchema,
  companySchema,
  jobSchema,
  idSchema,
  statusSchema,
} from '@/lib/validation';
export type ActionState = { error?: string; success?: string };
function fail(error: unknown): ActionState {
  return {
    error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
  };
}
function fields(form: FormData) {
  return Object.fromEntries(form.entries());
}
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
export async function authenticate(_: ActionState, form: FormData): Promise<ActionState> {
  let destination = '/dashboard';
  try {
    if (!configured())
      return {
        error:
          'Sign-in will be available when Supabase is connected. You can browse the sample jobs now.',
      };
    const credentials = authSchema.safeParse(fields(form));
    if (!credentials.success)
      return { error: 'Enter a valid email and a password of at least 8 characters.' };
    const client = await createClient();
    if (form.get('mode') === 'signup') {
      const fullName = String(form.get('full_name') ?? '').trim();
      if (fullName.length < 2 || fullName.length > 80)
        return { error: 'Enter your name (2–80 characters).' };
      const { error } = await client.auth.signUp({
        ...credentials.data,
        options: {
          data: {
            full_name: fullName,
            role: form.get('role') === 'recruiter' ? 'recruiter' : 'applicant',
          },
        },
      });
      if (error) return { error: error.message };
      return {
        success: 'Account created. Check your email to confirm your account, then sign in.',
      };
    }
    const { data, error } = await client.auth.signInWithPassword(credentials.data);
    if (error)
      return { error: 'Email or password is incorrect, or your email has not been confirmed.' };
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('id', data.user.id)
      .single();
    if (profileError || !profile)
      return { error: 'Your profile could not be loaded. Check the database setup.' };
    if (!profile.is_active) {
      await client.auth.signOut();
      return { error: 'Your account is suspended. Contact the administrator.' };
    }
    destination = home(profile.role);
  } catch (error) {
    return fail(error);
  }
  redirect(destination);
}
export async function signOut() {
  if (configured()) {
    const client = await createClient();
    await client.auth.signOut();
  }
  redirect('/');
}
export async function saveProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  try {
    const parsed = profileSchema.safeParse(fields(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const client = await createClient();
    const { error } = await client.from('profiles').update(parsed.data).eq('id', profile.id);
    check(error);
    revalidatePath('/profile');
    return { success: 'Profile saved.' };
  } catch (error) {
    return fail(error);
  }
}
export async function uploadResume(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireProfile(['applicant']);
  try {
    const file = form.get('resume');
    if (!(file instanceof File) || file.size === 0) return { error: 'Choose a PDF resume.' };
    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024)
      return { error: 'Upload a PDF no larger than 5 MB.' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
      return { error: 'This file is not a valid PDF.' };
    const client = await createClient();
    const path = `${profile.id}/${crypto.randomUUID()}.pdf`;
    const { error } = await client.storage
      .from('resumes')
      .upload(path, bytes, { contentType: 'application/pdf' });
    check(error);
    const { error: saveError } = await client
      .from('profiles')
      .update({ resume_path: path })
      .eq('id', profile.id);
    if (saveError) {
      await client.storage.from('resumes').remove([path]);
      check(saveError);
    }
    if (profile.resume_path) await client.storage.from('resumes').remove([profile.resume_path]);
    revalidatePath('/profile');
    return { success: 'Resume uploaded securely.' };
  } catch (error) {
    return fail(error);
  }
}
export async function saveCompany(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireProfile(['recruiter']);
  try {
    const parsed = companySchema.safeParse(fields(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const client = await createClient();
    const { data: existing, error: readError } = await client
      .from('companies')
      .select('id')
      .eq('owner_id', profile.id)
      .maybeSingle();
    check(readError);
    const { error } = existing
      ? await client.from('companies').update(parsed.data).eq('id', existing.id)
      : await client.from('companies').insert({ ...parsed.data, owner_id: profile.id });
    check(error);
    revalidatePath('/profile');
    revalidatePath('/recruiter');
    return { success: 'Company profile saved.' };
  } catch (error) {
    return fail(error);
  }
}
export async function saveJob(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireProfile(['recruiter', 'admin']);
  try {
    if (profile.role === 'recruiter' && !profile.approved)
      return { error: 'An administrator needs to approve your recruiter account first.' };
    const parsed = jobSchema.safeParse(fields(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const client = await createClient();
    const id = form.get('id');
    if (id) {
      idSchema.parse(id);
      const { data, error } = await client
        .from('jobs')
        .update(parsed.data)
        .eq('id', id)
        .select('id')
        .single();
      check(error);
      if (!data) throw new Error('Job not found or access denied.');
    } else {
      const { data: company, error } = await client
        .from('companies')
        .select('id')
        .eq('owner_id', profile.id)
        .single();
      if (error || !company) return { error: 'Save your company profile before posting a job.' };
      const { error: insertError } = await client
        .from('jobs')
        .insert({ ...parsed.data, company_id: company.id });
      check(insertError);
    }
  } catch (error) {
    return fail(error);
  }
  revalidatePath('/');
  revalidatePath('/recruiter');
  revalidatePath('/admin');
  redirect(home(profile.role));
}
export async function applyForJob(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireProfile(['applicant']);
  try {
    if (!profile.resume_path)
      return { error: 'Upload your resume in your profile before applying.' };
    const jobId = idSchema.parse(form.get('job_id'));
    const note = String(form.get('cover_note') ?? '').trim();
    if (note.length > 2000) return { error: 'Keep your note under 2,000 characters.' };
    const client = await createClient();
    const { error } = await client
      .from('applications')
      .insert({ job_id: jobId, applicant_id: profile.id, cover_note: note });
    if (error?.code === '23505') return { error: 'You have already applied to this job.' };
    check(error);
    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${jobId}`);
    return { success: 'Application sent. Track its progress in My applications.' };
  } catch (error) {
    return fail(error);
  }
}
export async function updateApplication(_: ActionState, form: FormData): Promise<ActionState> {
  await requireProfile(['recruiter', 'admin']);
  try {
    const client = await createClient();
    const id = idSchema.parse(form.get('id'));
    const status = statusSchema.parse(form.get('status'));
    const { error } = await client
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();
    check(error);
    revalidatePath('/recruiter');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: 'Status updated.' };
  } catch (error) {
    return fail(error);
  }
}
export async function changeJobState(_: ActionState, form: FormData): Promise<ActionState> {
  await requireProfile(['recruiter', 'admin']);
  try {
    const id = idSchema.parse(form.get('id'));
    const status = form.get('status');
    if (status !== 'published' && status !== 'closed') throw new Error('Invalid job status.');
    const client = await createClient();
    const { error } = await client
      .from('jobs')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();
    check(error);
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/recruiter');
    return { success: status === 'closed' ? 'Job closed.' : 'Job reopened.' };
  } catch (error) {
    return fail(error);
  }
}
export async function manageUser(_: ActionState, form: FormData): Promise<ActionState> {
  await requireProfile(['admin']);
  try {
    const client = await createClient();
    const id = idSchema.parse(form.get('id'));
    const action = form.get('action');
    if (!['approve', 'suspend', 'restore'].includes(String(action)))
      throw new Error('Invalid action.');
    const { error } = await client.rpc('manage_user', { target: id, action });
    check(error);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: 'Account updated.' };
  } catch (error) {
    return fail(error);
  }
}
export async function deleteRecord(_: ActionState, form: FormData): Promise<ActionState> {
  await requireProfile(['admin']);
  try {
    const client = await createClient();
    const id = idSchema.parse(form.get('id'));
    const table = form.get('table');
    if (table !== 'jobs' && table !== 'applications') throw new Error('Invalid record.');
    const { error } = await client.from(table).delete().eq('id', id).select('id').single();
    check(error);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: 'Record deleted.' };
  } catch (error) {
    return fail(error);
  }
}
