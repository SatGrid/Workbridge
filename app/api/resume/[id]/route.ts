import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { idSchema } from '@/lib/validation';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const client = await createClient();
  const { data } = await client.from('profiles').select('resume_path').eq('id', id).maybeSingle();
  if (!data?.resume_path)
    return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
  const { data: link, error } = await client.storage
    .from('resumes')
    .createSignedUrl(data.resume_path, 60, { download: 'resume.pdf' });
  if (error || !link) return NextResponse.json({ error: 'Resume unavailable' }, { status: 404 });
  return NextResponse.redirect(link.signedUrl, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
