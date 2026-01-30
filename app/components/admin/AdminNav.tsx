'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isAdminUser } from '../../lib/adminAuth';

type AdminNavProps = {
  className?: string;
};

export default function AdminNav({ className = '' }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname?.includes('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isAdminPath = typeof pathname === 'string' && pathname.startsWith('/admin');
  // Show agro links only when NOT on an /admin route, or when on /admin and authenticated
  const showAgroLinks = isAdminPath ? isAuthenticated : true;

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user && isAdminUser(session.user)) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isAdminUser(session.user)) setIsAuthenticated(true);
      else setIsAuthenticated(false);
    });

    return () => {
      mounted = false;
      try { subscription.unsubscribe(); } catch {}
    };
  }, []);

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase text-white/80 hover:text-white hover:border-amber-500/40 transition"
        >
          ← უკან
        </button>
        <Link
          href="/"
          className="bg-amber-600/80 border border-amber-500/50 px-4 py-2 rounded-xl text-xs font-black uppercase text-white hover:bg-amber-600 transition"
        >
          მთავარი
        </Link>
      </div>

      {showAgroLinks && (
        <div className="flex items-center gap-2">
          <Link href="/admin/agro" className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">აგრო-ბირჟა</Link>
          <Link href="/admin/grain" className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">მარცვლეული</Link>
        </div>
      )}
    </div>
  );
}
