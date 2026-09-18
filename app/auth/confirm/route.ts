import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (token && type === 'email') {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp({
      token_hash: token,
      type: type as EmailOtpType,
    });
    if (!error) return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.redirect(
    new URL('/login?message=Confirmation%20link%20expired%20or%20invalid.', request.url),
  );
}
