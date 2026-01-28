import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';


export async function POST(request: Request) {
  const authClient = await createClient();
  await authClient.auth.signOut();
  // Build absolute URL for redirect
  const url = new URL(request.url);
  url.pathname = '/admin/login';
  url.search = '';
  url.hash = '';
  return NextResponse.redirect(url.toString());
}
