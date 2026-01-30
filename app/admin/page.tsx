"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { getAdminDashboardStats } from './actions';
import { Suspense } from 'react';
import AdminAuthGuard from './AdminAuthGuard';
import AdminAgroPanel from './AdminAgroPanel';

const ADMIN_LINKS = [
  { href: '/admin/messages', title: 'შეტყობინებები', desc: 'კონტაქტის ფორმის მესიჯები' },
  { href: '/admin/posts', title: 'ადმინისტრატორის განცხადებები', desc: 'ადმინის პოსტების მართვა' },
  { href: '/admin/announcements', title: 'მომხმარებლის განცხადებები', desc: 'მომხმარებლების განცხადებების მოდერაცია' },
  { href: '/admin/community', title: 'სათემო ჩართულობა', desc: 'სათემო სექტორების მოდერაცია' },
  { href: '/admin/square', title: 'კახური მოედანი', desc: 'ჩატის მესიჯების მართვა' },
  { href: '/admin/transport', title: 'ტრანსპორტი', desc: 'მარშრუტების და განრიგის მართვა' },
  { href: '/admin/site-settings', title: 'საიტის პარამეტრები', desc: 'უკანა ფონის და სხვა პარამეტრების მართვა' },
  { href: '/admin/health', title: 'სისტემური აუდიტი', desc: 'საიტის სისტემური დიაგნოსტიკა' },
  { href: '/admin/diagnostic', title: 'დიაგნოსტიკა', desc: 'ადმინისტრატორის სტატუსის შემოწმება' },
];

const VERCEL_ANALYTICS_URL = 'https://vercel.com/dashboard';

type StatsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  href?: string;
};

function StatsCard({ title, value, description, icon, href }: StatsCardProps) {
  const content = (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-3xl shadow-2xl hover:border-amber-500/40 transition-all group">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase font-black text-white/60 tracking-[0.2em]">{title}</div>
        <div className="text-amber-400/90 group-hover:text-amber-300 transition">{icon}</div>
      </div>
      <div className="text-3xl font-black mt-4 text-white">{value}</div>
      {description && <p className="text-white/50 text-xs mt-2">{description}</p>}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

function AdminDashboardContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const statsData = await getAdminDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white/60">იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-amber-500">ადმინისტრატორის პანელი</h1>
            <p className="text-white/50 text-sm">მომხმარებელი: {stats?.email ?? '—'}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/" className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase">მთავარი</Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/admin/refresh', { method: 'POST' });
                } catch (err) {
                  console.error('refresh error', err);
                }
              }}
              className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase"
            >განახლება</button>
            {/* Client-side sign out to avoid 405 from server POST endpoints */}
            <ClientSignOutButton />
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatsCard
              title="მომხმარებლები"
              value={stats.usersCount}
              description="რეგისტრირებული მომხმარებლები"
              icon={(
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6" />
                  <path d="M23 11h-6" />
                </svg>
              )}
            />
            <StatsCard
              title="განცხადებები"
            value={stats.activeAnnouncements}
            description="აქტიური განცხადებები"
            icon={(
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h5" />
              </svg>
            )}
          />
          <StatsCard
            title="მოსალოდნელი"
            value={stats.pendingAnnouncements}
            description="მოდერაციაზე მყოფი განცხადებები"
            icon={(
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
          />
          <StatsCard
            title="ვიზიტორების ანალიტიკა"
            value="Vercel"
            description="Real User Traffic"
            href={VERCEL_ANALYTICS_URL}
            icon={(
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            )}
          />
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/10 transition-all">
              <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-amber-400">{link.title}</h3>
              <p className="text-white/50 text-sm">{link.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <AdminAgroPanel />
        </div>
      </div>
    </main>
  );
}

function AdminDashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getAdminDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white/60">იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-amber-500">ადმინისტრატორის პანელი</h1>
            <p className="text-white/50 text-sm">მომხმარებელი: {stats?.email ?? '—'}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/" className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase">მთავარი</Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/admin/refresh', { method: 'POST' });
                } catch (err) {
                  console.error('refresh error', err);
                }
              }}
              className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase"
            >განახლება</button>
            <ClientSignOutButton />
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatsCard
              title="მომხმარებლები"
              value={stats.usersCount}
              description="რეგისტრირებული მომხმარებლები"
              icon={(
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6" />
                  <path d="M23 11h-6" />
                </svg>
              )}
            />
            <StatsCard
              title="განცხადებები"
              value={stats.activeAnnouncements}
              description="აქტიური განცხადებები"
              icon={(
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h5" />
                </svg>
              )}
            />
            <StatsCard
              title="მოსალოდნელი"
              value={stats.pendingAnnouncements}
              description="მოდერაციაზე მყოფი განცხადებები"
              icon={(
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              )}
            />
            <StatsCard
              title="ვიზიტორების ანალიტიკა"
              value="Vercel"
              description="Real User Traffic"
              href={VERCEL_ANALYTICS_URL}
              icon={(
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/10 transition-all">
              <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-amber-400">{link.title}</h3>
              <p className="text-white/50 text-sm">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <AdminDashboardClient />
    </AdminAuthGuard>
  );
}

function ClientSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.push('/admin/login');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="bg-red-600 px-5 py-2 rounded-xl text-xs font-black uppercase"
    >
      გამოსვლა
    </button>
  );
}