import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

export async function POST(request: Request) {
  const authClient = await createClient();
  await authClient.auth.signOut();
  return NextResponse.redirect(new URL('/admin/login', request.url));
}
