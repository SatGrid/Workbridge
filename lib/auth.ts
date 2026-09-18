import { redirect } from 'next/navigation';
import { createClient, configured } from './supabase/server';
import type { Profile, Role } from './types';
export async function currentProfile(): Promise<Profile | null> {
  if (!configured()) return null;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw new Error('Your account profile could not be loaded. Check the database setup.');
  return data as Profile;
}
export function home(role: Role) {
  return role === 'admin' ? '/admin' : role === 'recruiter' ? '/recruiter' : '/dashboard';
}
export async function requireProfile(roles?: Role[]) {
  const profile = await currentProfile();
  if (!profile) redirect('/login');
  if (!profile.is_active)
    redirect('/login?message=Your%20account%20is%20suspended.%20Contact%20the%20administrator.');
  if (roles && !roles.includes(profile.role)) redirect(home(profile.role));
  return profile;
}
