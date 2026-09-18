import { createClient, configured } from './supabase/server';
import { sampleJobs } from './sample';
import type { Job } from './types';
export async function getJobs(): Promise<Job[]> {
  if (!configured()) return sampleJobs;
  const client = await createClient();
  const { data, error } = await client
    .from('jobs')
    .select('*, companies(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Could not load jobs. Please try again.');
  return data as unknown as Job[];
}
export async function getJob(id: string): Promise<Job | null> {
  if (!configured()) return sampleJobs.find((j) => j.id === id) ?? null;
  const client = await createClient();
  const { data, error } = await client
    .from('jobs')
    .select('*, companies(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Could not load this job. Please try again.');
  return data as unknown as Job | null;
}
