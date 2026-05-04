'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params?.get('redirect') || '/';

  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setMessage('');
  }, [password, confirmPassword]);

  useEffect(() => {
    let active = true;

    const initRecovery = async () => {
      try {
        const code = params?.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (active) setSessionReady(true);
          return;
        }

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
          if (active) {
            setSessionReady(true);
            try {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch {
              // ignore
            }
          }
          return;
        }

        if (active) {
          setSessionReady(false);
          setError('ლინკი არასწორია ან ვადა ამოიწურა. გთხოვთ თავიდან სცადოთ.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'უცნობი შეცდომა';
        if (active) {
          setSessionReady(false);
          setError(msg);
        }
      }
    };

    initRecovery();

    return () => {
      active = false;
    };
  }, [params]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('გთხოვთ შეავსოთ ორივე ველი.');
      return;
    }

    if (password.length < 6) {
      setError('პაროლი უნდა იყოს მინ. 6 სიმბოლო.');
      return;
    }

    if (password !== confirmPassword) {
      setError('პაროლები არ ემთხვევა.');
      return;
    }

    if (!sessionReady) {
      setError('პაროლის განახლებისთვის საჭიროა ვალიდური ბმული.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('პაროლი განახლდა. გადამისამართება მიმდინარეობს...');
      setTimeout(() => {
        router.replace(redirect);
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'უცნობი შეცდომა';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4 backdrop-blur-xl">
        <h1 className="text-xl font-black uppercase italic text-amber-500">პაროლის აღდგენა</h1>
        <p className="text-[11px] text-white/60">შეიყვანეთ ახალი პაროლი.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
            placeholder="ახალი პაროლი"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
            placeholder="გაიმეორეთ პაროლი"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <p className="text-[10px] text-white/60">პაროლი: მინ. 6 სიმბოლო</p>
          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="w-full rounded-xl bg-amber-600 text-white font-black py-3 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
          >
            {loading ? 'იტვირთება...' : 'პაროლის განახლება'}
          </button>
        </form>

        {error && <p className="text-red-300 text-xs font-semibold">{error}</p>}
        {message && <p className="text-emerald-300 text-xs font-semibold">{message}</p>}
      </div>
    </main>
  );
}
