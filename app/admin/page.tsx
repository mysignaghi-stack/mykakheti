'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import AdminAuthGuard from './AdminAuthGuard';

const VERCEL_ANALYTICS_URL = 'https://vercel.com/dashboard';

const ADMIN_SECTIONS = [
  {
    title: 'მოდერაცია',
    description: 'მომხმარებლის მიერ დამატებული კონტენტის დამტკიცება და მართვა.',
    links: [
      { href: '/admin/announcements', title: 'განცხადებები', desc: 'ჩვეულებრივი განცხადებები, დაგეგმვა, დამტკიცება და წაშლა.', accent: 'amber' },
      { href: '/admin/community', title: 'სათემო კონტენტი', desc: 'დაკარგული/ნაპოვნი და სერვისები.', accent: 'emerald' },
      { href: '/admin/square', title: 'კახური მოედანი', desc: 'ჩატის შეტყობინებები და დაბლოკილი მომხმარებლები.', accent: 'cyan' },
      { href: '/admin/messages', title: 'შეტყობინებები', desc: 'კონტაქტის ფორმიდან შემოსული წერილები.', accent: 'blue' },
    ],
  },
  {
    title: 'მთავარი გვერდი და კონტენტი',
    description: 'იმ ელემენტების მართვა, რომლებიც პირდაპირ ჩანს საიტის მთავარ ეკრანზე.',
    links: [
      { href: '/admin/posts', title: 'ადმინის ბანერები/პოსტები', desc: 'მთავარი გვერდის ჩარჩოები, მედია, გამოქვეყნება და არქივი.', accent: 'amber' },
      { href: '/admin/site-settings', title: 'საიტის პარამეტრები', desc: 'ფონი, მარკიზი და ჰედერის წარწერა.', accent: 'purple' },
      { href: '/admin/transport', title: 'ტრანსპორტი', desc: 'მარშრუტები და განრიგები.', accent: 'cyan' },
    ],
  },
  {
    title: 'მონაცემები და ცნობარები',
    description: 'ფასების, ცხრილების და დამხმარე მონაცემების განახლება.',
    links: [
      { href: '/admin/agro', title: 'აგრო-ბირჟა', desc: 'ყურძნისა და აგრო ფასების მართვა.', accent: 'purple' },
      { href: '/admin/grain', title: 'მარცვლეული', desc: 'მარცვლეულის ფასების მართვა.', accent: 'yellow' },
    ],
  },
];

const TECHNICAL_LINKS = [
  { href: '/admin/health', title: 'სისტემური აუდიტი', desc: 'DB/API/Storage შემოწმებები და cleanup ინსტრუმენტები.' },
  { href: '/admin/diagnostic', title: 'ადმინის დიაგნოსტიკა', desc: 'ავტორიზაციის სტატუსი და user metadata.' },
  { href: '/admin/moderation', title: 'მოდერაციის დიაგნოსტიკა', desc: 'pending announcement rows-ის ტექნიკური ნახვა.' },
  { href: '/admin/moderate', title: 'Legacy მოდერაცია', desc: 'ძველი მოდერაციის ეკრანი, დატოვებულია თავსებადობისთვის.' },
  { href: '/admin/businesses', title: 'Business legacy', desc: 'ამჟამად საჯარო UI-ში აქტიურად არ ჩანს, მაგრამ route შენარჩუნებულია.' },
];

type StatsCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  href?: string;
};

function StatsCard({ title, value, description, icon, href }: StatsCardProps) {
  const content = (
    <div className="h-full rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:border-amber-400/35 hover:bg-white/[0.07]">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{title}</div>
        <div className="text-amber-300/85">{icon}</div>
      </div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
      <p className="mt-2 text-xs leading-relaxed text-white/45">{description}</p>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block h-full">
      {content}
    </a>
  );
}

function AdminLinkCard({ link }: { link: { href: string; title: string; desc: string; accent?: string } }) {
  const accentClass = {
    amber: 'group-hover:text-amber-300',
    emerald: 'group-hover:text-emerald-300',
    cyan: 'group-hover:text-cyan-300',
    blue: 'group-hover:text-blue-300',
    purple: 'group-hover:text-purple-300',
    yellow: 'group-hover:text-yellow-300',
  }[link.accent ?? 'amber'];

  return (
    <Link
      href={link.href}
      className="group block rounded-2xl border border-white/10 bg-[#0b0b15]/80 p-5 text-left transition hover:border-amber-400/35 hover:bg-white/[0.07]"
    >
      <h3 className={`text-base font-black uppercase tracking-[0.08em] text-white transition ${accentClass}`}>{link.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/50">{link.desc}</p>
    </Link>
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
      className="rounded-xl border border-red-400/30 bg-red-500/15 px-5 py-2 text-xs font-black uppercase text-red-100 transition hover:bg-red-500/25"
    >
      გამოსვლა
    </button>
  );
}

function AdminDashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch('/api/admin/dashboard-stats', { credentials: 'same-origin' });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'Failed to fetch stats');
        setStats(json);
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
      <main className="flex min-h-screen items-center justify-center bg-[#050510] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-amber-500" />
          <p className="text-white/60">იტვირთება...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/70">MyKakheti admin</p>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">ადმინისტრატორის პანელი</h1>
            <p className="mt-2 text-sm text-white/50">მომხმარებელი: {stats?.email ?? '—'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-black uppercase transition hover:bg-white/10">მთავარი</Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/admin/refresh', { method: 'POST' });
                } catch (err) {
                  console.error('refresh error', err);
                }
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-black uppercase transition hover:bg-white/10"
            >
              განახლება
            </button>
            <ClientSignOutButton />
          </div>
        </div>

        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="მომხმარებლები"
              value={stats.usersCount ?? '—'}
              description="რეგისტრირებული მომხმარებლები"
              icon={<span className="text-xl">👤</span>}
            />
            <StatsCard
              title="აქტიური განცხადებები"
              value={stats.activeAnnouncements ?? '—'}
              description="საიტზე გამოქვეყნებული განცხადებები"
              icon={<span className="text-xl">📄</span>}
            />
            <StatsCard
              title="მოდერაციაზე"
              value={stats.pendingAnnouncements ?? '—'}
              description="დამტკიცების მოლოდინში არსებული ჩანაწერები"
              icon={<span className="text-xl">⏱</span>}
            />
            <StatsCard
              title="ანალიტიკა"
              value="Vercel"
              description="ვიზიტორების და traffic მონაცემები"
              href={VERCEL_ANALYTICS_URL}
              icon={<span className="text-xl">↗</span>}
            />
          </div>
        )}

        <div className="space-y-6">
          {ADMIN_SECTIONS.map((section) => (
            <section key={section.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-2xl md:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-black uppercase tracking-[0.12em] text-amber-300">{section.title}</h2>
                <p className="mt-1 text-sm text-white/45">{section.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {section.links.map((link) => (
                  <AdminLinkCard key={link.href} link={link} />
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/45">ტექნიკური და legacy გვერდები</h2>
              <p className="mt-1 text-sm text-white/35">ეს გვერდები არ წაიშალა, რადგან დიაგნოსტიკისთვის ან თავსებადობისთვის შეიძლება დაგვჭირდეს.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {TECHNICAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/25 hover:bg-white/[0.04]">
                  <h3 className="text-sm font-black uppercase text-white/70">{link.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
}
