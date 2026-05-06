'use client';

import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

const CARD_CONTENT = [
  {
    key: 'lost-found',
    title: 'დაკარგული/ნაპოვნის რეესტრი',
    badge: 'სანდო • სწრაფი • უსაფრთხო',
    headline: 'დაკარგული ნივთების მოძებნა სწრაფად და მარტივად',
    description: 'იპოვეთ დაკარგული ნივთები ან განათავსეთ ნაპოვნი ნივთის შესახებ ინფორმაცია ერთ სივრცეში.',
    cta: 'გადადით რეესტრში',
    statValue: '1,248+',
    statLabel: 'აქტიური განცხადება',
    href: '/community/lost-found',
    glow: 'from-[#1b120b]/90 via-[#120c07]/85 to-[#2a1a0f]/80',
    accent: 'border-amber-500/60 shadow-[0_0_30px_rgba(230,126,0,0.18)]',
    icons: [MagnifierIcon, WalletIcon, KeyIcon, PinIcon],
  },
  {
    key: 'masters',
    title: 'ხელოსნების/ტექნიკოსების რეესტრი',
    badge: 'კვალიფიკაცია • გამოცდილება • სანდოობა',
    headline: 'იპოვეთ სანდო ხელოსნები და ტექნიკოსები მარტივად',
    description: 'მოიძიეთ ხელოსნები და ტექნიკოსები სერვისის მიხედვით, შეფასებებითა და საკონტაქტო მონაცემებით.',
    cta: 'გადადით რეესტრში',
    statValue: '2,356+',
    statLabel: 'სერვის პროვაიდერი',
    href: '/community/masters',
    glow: 'from-[#111318]/90 via-[#0f1116]/85 to-[#1b120b]/75',
    accent: 'border-amber-400/50 shadow-[0_0_26px_rgba(230,126,0,0.14)]',
    icons: [HammerIcon, WrenchIcon, ScrewdriverIcon, ToolboxIcon],
  },
];

export default function RegistryFeatureCards() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-8">
        {CARD_CONTENT.map(({ key, ...card }) => (
          <RegistryCard key={key} {...card} />
        ))}
      </div>
    </section>
  );
}

type RegistryCardProps = {
  title: string;
  badge: string;
  headline: string;
  description: string;
  cta: string;
  statValue: string;
  statLabel: string;
  href: string;
  glow: string;
  accent: string;
  icons: Array<(props: { className?: string }) => ReactElement>;
};

function RegistryCard({ title, badge, headline, description, cta, statValue, statLabel, href, glow, accent, icons }: RegistryCardProps) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[28px] border ${accent} bg-gradient-to-br ${glow} px-6 py-6 sm:px-7 sm:py-7 md:px-9 md:py-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.4)]`}
      aria-label={title}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,153,0,0.18),_transparent_55%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,200,120,0.12),_transparent_50%)] opacity-60" />
      <div className="absolute inset-3 rounded-[24px] border border-amber-500/10" />

      <div className="relative z-10 flex h-full flex-col gap-4 sm:gap-5">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/60 to-amber-400/40" />
            <span className="rounded-full border border-amber-400/40 bg-black/50 px-4 py-1.5 shadow-[0_0_12px_rgba(230,126,0,0.25)]">
              {title}
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400/60 to-amber-400/40" />
          </div>

          <div className="mt-4 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
            {badge}
          </div>
        </div>

        <div className="text-left md:max-w-[55%]">
          <p className="text-lg sm:text-xl font-black text-white/90 leading-snug">
            {headline}
          </p>
          <p className="mt-2 text-sm sm:text-[15px] text-white/70 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-black/40 px-4 py-2">
            <span className="text-lg font-black text-amber-200">{statValue}</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">{statLabel}</span>
          </div>
          <span className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.2em] text-amber-200 transition-all duration-300 group-hover:bg-amber-500/20 group-hover:text-amber-100">
            {cta}
            <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>

      <IconCluster icons={icons} />
    </Link>
  );
}

type IconClusterProps = {
  icons: Array<(props: { className?: string }) => ReactElement>;
};

function IconCluster({ icons }: IconClusterProps) {
  return (
    <div className="pointer-events-none absolute right-4 bottom-4 sm:right-5 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto opacity-70 sm:opacity-90 scale-[0.75] sm:scale-100">
      <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />
      <div className="absolute right-4 top-6 h-28 w-28 rounded-full border border-amber-400/20" />
      <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
      {icons.map((Icon, index) => (
        <div
          key={index}
          className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-black/40 shadow-[0_0_18px_rgba(230,126,0,0.25)]"
        >
          <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-amber-300/90 drop-shadow-[0_0_10px_rgba(230,126,0,0.35)]" />
        </div>
      ))}
      </div>
    </div>
  );
}

function IconBase({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="6" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
    </IconBase>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 7V5h10v2" />
      <circle cx="16" cy="13" r="1" />
    </IconBase>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="7" cy="14" r="3" />
      <path d="M10 14h10" />
      <path d="M16 14v3" />
      <path d="M19 14v2" />
    </IconBase>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 21s6-6.4 6-11a6 6 0 1 0-12 0c0 4.6 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

function HammerIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M6 6h7l2 2-2 2H6z" />
      <path d="M9 8l8 8" />
      <path d="M7 16l2-2" />
    </IconBase>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M15 6a4 4 0 0 1-5 5l-5 5a2 2 0 0 0 3 3l5-5a4 4 0 0 1 5-5" />
    </IconBase>
  );
}

function ScrewdriverIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M14 4l6 6-2 2-6-6z" />
      <path d="M4 20l6-6" />
      <path d="M6 18l-2 2" />
    </IconBase>
  );
}

function ToolboxIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="8" width="16" height="10" rx="2" />
      <path d="M9 8V6h6v2" />
      <path d="M4 12h16" />
    </IconBase>
  );
}
