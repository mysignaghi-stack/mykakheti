import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../types/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const cookieStore = await cookies();
  const cookieRedirect = cookieStore.get('auth_redirect')?.value;
  const redirect = requestUrl.searchParams.get('redirect') || (cookieRedirect ? decodeURIComponent(cookieRedirect) : '/');
  const target = new URL(`/auth/complete?redirect=${encodeURIComponent(redirect)}`, requestUrl);
  const response = NextResponse.redirect(target);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are missing in .env.local file!');
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  if (cookieRedirect) {
    response.cookies.set('auth_redirect', '', { path: '/', maxAge: 0 });
  }

  return response;
}
