'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isAdminUser } from '../../lib/adminAuth';

type AdminNavProps = {
  className?: string;
};

const PRIMARY_LINKS = [
  { href: '/admin', label: 'პანელი' },
  { href: '/admin/moderate', label: 'მოდერაცია' },
  { href: '/admin/announcements', label: 'გამოქვეყნებული' },
  { href: '/admin/community', label: 'სერვისები/სათემო' },
  { href: '/admin/posts', label: 'ადმინ პოსტები' },
  { href: '/admin/site-settings', label: 'პარამეტრები' },
];

const SECONDARY_LINKS = [
  { href: '/admin/agro', label: 'აგრო' },
  { href: '/admin/grain', label: 'მარცვლეული' },
  { href: '/admin/transport', label: 'ტრანსპორტი' },
  { href: '/admin/square', label: 'მოედანი' },
  { href: '/admin/messages', label: 'წერილები' },
];

export default function AdminNav({ className = '' }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname?.includes('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setIsAuthenticated(Boolean(session?.user && isAdminUser(session.user)));
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    };

    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user && isAdminUser(session.user)));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const renderLink = (link: { href: string; label: string }) => {
    const active = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black uppercase transition ${
          active
            ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
            : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
        }`}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className={`rounded-2xl border border-white/10 bg-black/25 p-3 ${className}`.trim()}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase text-white/70 transition hover:text-white"
            >
              ← უკან
            </button>
            <Link
              href="/"
              className="rounded-lg border border-amber-500/40 bg-amber-600/80 px-3 py-2 text-xs font-black uppercase text-white transition hover:bg-amber-600"
            >
              მთავარი
            </Link>
          </div>
          {isLogin && (
            <Link href="/admin/diagnostic" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase text-white/55 hover:text-white">
              დიაგნოსტიკა
            </Link>
          )}
        </div>

        {isAuthenticated && (
          <>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_LINKS.map(renderLink)}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {SECONDARY_LINKS.map(renderLink)}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
