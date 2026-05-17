'use client';

import AdminAuthGuard from '../AdminAuthGuard';
import AdminNav from '../../components/admin/AdminNav';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const analyticsLinks = [
  {
    title: 'Google Analytics 4',
    href: 'https://analytics.google.com/',
    description: 'Realtime, Traffic acquisition, Events და Key events.',
  },
  {
    title: 'Google Search Console',
    href: 'https://search.google.com/search-console',
    description: 'Google ძიების ჩვენებები, კლიკები, სიტყვები და ინდექსაცია.',
  },
  {
    title: 'Meta Events Manager',
    href: 'https://business.facebook.com/events_manager',
    description: 'Pixel მოვლენები Facebook/Instagram რეკლამებისთვის.',
  },
];

const trackedEvents = [
  { name: 'sign_up', label: 'რეგისტრაცია', goal: 'აჩვენებს, რამდენი ადამიანი გახდა პლატფორმის მომხმარებელი' },
  { name: 'add_listing', label: 'განცხადების დამატება', goal: 'ყველაზე მნიშვნელოვანი ქმედება ბაზრის აქტივობის გასაზომად' },
  { name: 'add_service', label: 'სერვისის დამატება', goal: 'ავსებს საიტს რეალური შემოთავაზებებით' },
  { name: 'service_request', label: 'სერვისის მოთხოვნა', goal: 'აჩვენებს მოთხოვნას მომსახურებაზე' },
  { name: 'phone_click', label: 'ტელეფონის ნომერზე დაჭერა', goal: 'აჩვენებს რეალურ ინტერესს და კონტაქტის მცდელობას' },
  { name: 'facebook_share', label: 'Facebook გაზიარება', goal: 'ზრდის ორგანულ გავრცელებას' },
  { name: 'share', label: 'გაზიარება', goal: 'ზომავს მობილურ native share ქმედებას' },
  { name: 'copy_link', label: 'ბმულის კოპირება', goal: 'ზომავს განცხადების გაზიარების ალტერნატიულ ქმედებას' },
];

function StatusCard({ title, value, configured }: { title: string; value?: string; configured: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${configured ? 'border-emerald-300/25 bg-emerald-500/10' : 'border-amber-300/25 bg-amber-500/10'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">{title}</h2>
          <p className="mt-2 text-xs font-bold text-white/45">{value || 'env ცვლადი ჯერ არ არის დაყენებული'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${configured ? 'bg-emerald-400/15 text-emerald-100' : 'bg-amber-400/15 text-amber-100'}`}>
          {configured ? 'ჩართულია' : 'საჭიროა დაყენება'}
        </span>
      </div>
    </div>
  );
}

function AnalyticsPageContent() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNav />

        <header className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl md:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/70">Analytics control</p>
          <h1 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white md:text-3xl">ანალიტიკა და ძირითადი მოვლენები</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55">
            აქ ჩანს ჩართულია თუ არა GA4, Search Console verification და Meta Pixel. რეალური ციფრები ოფიციალურ პანელებში იხსნება, ხოლო მათი პირდაპირ აქ გამოტანა შესაძლებელია API კავშირის დამატებით.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatusCard title="Google Analytics 4" value={GA_MEASUREMENT_ID} configured={Boolean(GA_MEASUREMENT_ID)} />
          <StatusCard title="Search Console" value={GOOGLE_SITE_VERIFICATION ? 'verification tag დაყენებულია' : undefined} configured={Boolean(GOOGLE_SITE_VERIFICATION)} />
          <StatusCard title="Meta Pixel" value={META_PIXEL_ID} configured={Boolean(META_PIXEL_ID)} />
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-2xl md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-emerald-200">სად ნახავთ მონაცემებს</h2>
            <p className="mt-1 text-sm text-white/45">ამ ბმულებით გაიხსნება ოფიციალური ანალიტიკის ანგარიშები.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {analyticsLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-[#0b0b15]/80 p-5 transition hover:border-emerald-300/35 hover:bg-white/[0.06]"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">{link.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/45">{link.description}</p>
                <span className="mt-4 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/75">გახსნა</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-2xl md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-amber-200">საიტიდან გაგზავნილი მოვლენები</h2>
            <p className="mt-1 text-sm text-white/45">GA4-ში ეს event-ები უნდა მონიშნოთ Key event-ებად, როცა პირველად გამოჩნდება.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[0.8fr_1fr_1.4fr] gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              <span>Event</span>
              <span>ქმედება</span>
              <span>რატომ არის მნიშვნელოვანი</span>
            </div>
            {trackedEvents.map((event) => (
              <div key={event.name} className="grid grid-cols-[0.8fr_1fr_1.4fr] gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                <code className="text-xs font-bold text-emerald-200">{event.name}</code>
                <span className="font-bold text-white/80">{event.label}</span>
                <span className="text-xs leading-relaxed text-white/45">{event.goal}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-300/20 bg-cyan-500/10 p-5 md:p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">შემდეგი ეტაპი</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            თუ გინდათ, რომ ნახვები, რეგისტრაციები და რეკლამიდან მოსული შედეგები პირდაპირ ამ admin გვერდზე ცხრილებად/გრაფიკებად გამოჩნდეს, საჭიროა Google Analytics Data API, Search Console API და Meta Marketing API-ს access token-ების ან service account-ის მიბმა.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminAuthGuard>
      <AnalyticsPageContent />
    </AdminAuthGuard>
  );
}
