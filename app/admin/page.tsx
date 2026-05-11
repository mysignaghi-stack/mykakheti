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
    title: 'მოდერაცია და შემომავალი',
    description: 'ყველა ახალი ჩანაწერი, რომელიც დამტკიცებას ან პირველ შემოწმებას ელოდება.',
    links: [
      { href: '/admin/moderate', title: 'განცხადებების მოდერაცია', desc: 'ჩვეულებრივი განცხადებები, აგრო-ბირჟა და მარცვლეული ერთ შემოსულში.', accent: 'amber' },
      { href: '/admin/community', title: 'სერვისები და სათემო ჩანაწერები', desc: 'სერვისული განცხადებები და დაკარგული/ნაპოვნი ჩანაწერები.', accent: 'emerald' },
      { href: '/admin/messages', title: 'მომხმარებლის წერილები', desc: 'კონტაქტის ფორმიდან შემოსული შეტყობინებები.', accent: 'blue' },
    ],
  },
  {
    title: 'გამოქვეყნებული კონტენტი',
    description: 'უკვე გამოქვეყნებული ან საიტის მთავარ გვერდზე გამოსაჩენი მასალის მართვა.',
    links: [
      { href: '/admin/announcements', title: 'გამოქვეყნებული განცხადებები', desc: 'დამტკიცებული განცხადებები, დაგეგმვა, არქივი და წაშლა.', accent: 'amber' },
      { href: '/admin/posts', title: 'ადმინისტრატორის პოსტები', desc: 'მთავარი გვერდის ჩარჩოები, ფოტო/ვიდეო მასალა და არქივი.', accent: 'purple' },
      { href: '/admin/square', title: 'კახური მოედანი', desc: 'ჩატის შეტყობინებები და დაბლოკილი მომხმარებლები.', accent: 'cyan' },
    ],
  },
  {
    title: 'მონაცემები და პარამეტრები',
    description: 'ფასების, ცხრილების, ტრანსპორტის და საიტის დამხმარე პარამეტრების განახლება.',
    links: [
      { href: '/admin/site-settings', title: 'საიტის პარამეტრები', desc: 'ფონი, მარკიზი და ჰედერის წარწერა.', accent: 'purple' },
      { href: '/admin/transport', title: 'ტრანსპორტი', desc: 'მარშრუტები და განრიგები.', accent: 'cyan' },
      { href: '/admin/agro', title: 'აგრო-ბირჟა', desc: 'აგრო ფასების და შესაბამისი ცხრილის მართვა.', accent: 'emerald' },
      { href: '/admin/grain', title: 'მარცვლეული', desc: 'მარცვლეულის ფასების მართვა.', accent: 'yellow' },
    ],
  },
];

const TECHNICAL_LINKS = [
  { href: '/admin/health', title: 'სისტემური აუდიტი', desc: 'DB/API/Storage შემოწმებები და cleanup ინსტრუმენტები.' },
  { href: '/admin/diagnostic', title: 'ადმინის დიაგნოსტიკა', desc: 'ავტორიზაციის სტატუსი და user metadata.' },
  { href: '/admin/moderation', title: 'მოდერაციის დიაგნოსტიკა', desc: 'pending announcement rows-ის ტექნიკური ნახვა.' },
  { href: '/admin/businesses', title: 'ძველი ბიზნეს-მოდული', desc: 'საჯარო UI-ში აქტიურად აღარ ჩანს, მაგრამ route შენარჩუნებულია თავსებადობისთვის.' },
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

type PendingQueue = {
  key: string;
  title: string;
  description: string;
  value: number;
  href: string;
  accent: string;
};

function PendingQueueCard({ queue }: { queue: PendingQueue }) {
  const accentClass = {
    amber: 'border-amber-300/35 bg-amber-500/10 text-amber-100 hover:border-amber-300/60',
    purple: 'border-purple-300/35 bg-purple-500/10 text-purple-100 hover:border-purple-300/60',
    yellow: 'border-yellow-300/35 bg-yellow-500/10 text-yellow-100 hover:border-yellow-300/60',
    emerald: 'border-emerald-300/35 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/60',
    cyan: 'border-cyan-300/35 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300/60',
  }[queue.accent] ?? 'border-white/15 bg-white/5 text-white/75 hover:border-white/35';

  return (
    <Link
      href={queue.href}
      className={`group flex h-full flex-col justify-between rounded-2xl border p-5 text-left transition ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em]">{queue.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-white/50">{queue.description}</p>
        </div>
        <span className={`rounded-2xl px-3 py-2 text-2xl font-black ${queue.value > 0 ? 'bg-white/15 text-white' : 'bg-black/20 text-white/35'}`}>
          {queue.value}
        </span>
      </div>
      <span className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/45 transition group-hover:text-white/80">
        გადასვლა →
      </span>
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

  const pendingQueues: PendingQueue[] = [
    {
      key: 'regular',
      title: 'ჩვეულებრივი განცხადებები',
      description: 'ყიდვა/გაყიდვა, ქირა და სხვა სტანდარტული განცხადებები.',
      value: stats?.pendingQueues?.regularAnnouncements ?? 0,
      href: '/admin/moderate',
      accent: 'amber',
    },
    {
      key: 'agro',
      title: 'აგრო ბირჟა',
      description: 'მომხმარებლის აგრო ფასის განაცხადები.',
      value: stats?.pendingQueues?.agro ?? 0,
      href: '/admin/moderate',
      accent: 'purple',
    },
    {
      key: 'grain',
      title: 'მარცვლეული',
      description: 'მარცვლეულის ფასის განაცხადები.',
      value: stats?.pendingQueues?.grain ?? 0,
      href: '/admin/moderate',
      accent: 'yellow',
    },
    {
      key: 'lost-found',
      title: 'დაკარგული/ნაპოვნი',
      description: 'სათემო რეესტრში დასამტკიცებელი ჩანაწერები.',
      value: stats?.pendingQueues?.lostFound ?? 0,
      href: '/admin/community',
      accent: 'cyan',
    },
    {
      key: 'services',
      title: 'სერვისები',
      description: 'მომსახურების მიმწოდებლების დასამტკიცებელი ჩანაწერები.',
      value: stats?.pendingQueues?.services ?? 0,
      href: '/admin/community',
      accent: 'emerald',
    },
  ];
  const pendingTotal = pendingQueues.reduce((sum, queue) => sum + queue.value, 0);

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
              value={pendingTotal}
              description="ყველა განყოფილებაში დამტკიცების მოლოდინში არსებული ჩანაწერები"
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

        {stats && (
          <section className="mb-8 rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-amber-500/10 via-white/[0.035] to-emerald-500/5 p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/70">მოდერაციის შემომავალი</p>
                <h2 className="mt-1 text-xl font-black uppercase text-white">სად არის მოსული დასამტკიცებელი განცხადება</h2>
                <p className="mt-1 text-sm text-white/45">დააკლიკეთ შესაბამის ფანჯარას და პირდაპირ გადადით იმ განყოფილებაში.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">სულ</p>
                <p className={`text-3xl font-black ${pendingTotal > 0 ? 'text-amber-200' : 'text-white/35'}`}>{pendingTotal}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {pendingQueues.map((queue) => (
                <PendingQueueCard key={queue.key} queue={queue} />
              ))}
            </div>
          </section>
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

          <details className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <summary className="cursor-pointer select-none text-sm font-black uppercase tracking-[0.22em] text-white/45 transition hover:text-white/70">
              ტექნიკური და შენარჩუნებული გვერდები
            </summary>
            <p className="mt-3 text-sm text-white/35">
              ეს გვერდები მთავარ სამუშაო პროცესში აღარ ჩანს, მაგრამ არ წაიშალა, რადგან დიაგნოსტიკისთვის ან თავსებადობისთვის შეიძლება დაგვჭირდეს.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {TECHNICAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/25 hover:bg-white/[0.04]">
                  <h3 className="text-sm font-black uppercase text-white/70">{link.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{link.desc}</p>
                </Link>
              ))}
            </div>
          </details>
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
