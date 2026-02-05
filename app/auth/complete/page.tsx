'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCompletePage() {
  const params = useSearchParams();
  const redirect = params?.get('redirect') || '/';

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mykakheti-auth');
      channel.postMessage({ type: 'auth-complete', redirect });
    } catch {
      // BroadcastChannel may be unavailable in older browsers.
    }

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'auth-complete', redirect }, window.location.origin);
      }
    } catch {
      // ignore
    }

    const timer = window.setTimeout(() => {
      try {
        if (window.opener && !window.opener.closed) {
          window.close();
          return;
        }
      } catch {
        // ignore
      }
      window.location.replace(redirect);
    }, 400);

    return () => {
      if (channel) channel.close();
      window.clearTimeout(timer);
    };
  }, [redirect]);

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
      <div className="text-center space-y-3">
        <div className="text-2xl font-black uppercase italic text-amber-500">ავტორიზაცია დასრულდა</div>
        <div className="text-sm text-white/60">გადამისამართება მიმდინარეობს...</div>
      </div>
    </main>
  );
}
