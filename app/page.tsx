import { getJobs } from '@/lib/data';
import { configured } from '@/lib/supabase/server';
import { JobBrowser } from '@/components/job-browser';
export const dynamic = 'force-dynamic';
export default async function Page() {
  return <JobBrowser jobs={await getJobs()} sample={!configured()} />;
}
