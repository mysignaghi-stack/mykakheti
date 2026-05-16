'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../lib/authErrors';

function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const finalize = async () => {
      try {
        const redirectParam = params?.get('redirect') || '/';
        const code = params?.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const hash = typeof window !== 'undefined' ? window.location.hash : '';
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const errorDescription = hashParams.get('error_description');

          if (errorDescription) {
            throw new Error(decodeURIComponent(errorDescription));
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }

        if (!active) return;
        router.replace(`/auth/complete?redirect=${encodeURIComponent(redirectParam)}`);
      } catch (err: unknown) {
        if (active) setError(getAuthErrorMessage(err));
      }
    };

    finalize();

    return () => {
      active = false;
    };
  }, [params, router]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-3">
          <div className="text-2xl font-black uppercase italic text-amber-500">ავტორიზაცია ვერ შესრულდა</div>
          <div className="text-sm text-white/60">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
      <div className="text-center space-y-3">
        <div className="text-2xl font-black uppercase italic text-amber-500">ავტორიზაცია მიმდინარეობს</div>
        <div className="text-sm text-white/60">გთხოვთ დაელოდოთ...</div>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
          <div className="text-center space-y-3">
            <div className="text-2xl font-black uppercase italic text-amber-500">ავტორიზაცია მიმდინარეობს</div>
            <div className="text-sm text-white/60">გთხოვთ დაელოდოთ...</div>
          </div>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
