'use client';

import Link from 'next/link';

interface CommunityEngagementSectionProps {
  className?: string;
}

type CommunityCardConfig = {
  key: 'lost-found' | 'masters';
  icon: string;
  label: string;
  submitHref: string;
  submitLabel: string;
  viewHref: string;
  viewLabel: string;
};

const COMMUNITY_CARDS: CommunityCardConfig[] = [
  {
    key: 'lost-found',
    icon: '🔎',
    label: 'დაკარგული/ნაპონის რეესტრი',
    submitHref: '/community/lost-found/submit',
    submitLabel: 'დაკარგული/ნაპოვნის დამატება',
    viewHref: '/community/lost-found',
    viewLabel: 'ნახვა',
  },
  {
    key: 'masters',
    icon: '🛠️',
    label: 'სერვისები / მომსახურების მიმწოდებლები',
    submitHref: '/community/masters/submit',
    submitLabel: 'სერვისის დამატება',
    viewHref: '/community/masters',
    viewLabel: 'ნახვა',
  },
];

export default function CommunityEngagementSection({ className }: CommunityEngagementSectionProps) {

  const containerClasses = [
    'bg-black/70 backdrop-blur-3xl rounded-[30px] p-4 md:p-6 shadow-3xl border border-white/10',
    className ?? '',
  ]
    .join(' ')
    .trim();

  return (
    <div className={containerClasses}>
      <h4 className="text-white font-black uppercase tracking-[0.4em] mb-1 w-full text-center">სათემო ჩართულობა</h4>
      <p className="w-full text-white font-bold uppercase tracking-[0.2em] mb-2 leading-tight text-center">
        გამოქვეყნეთ და გააზიარეთ
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 w-full">
        {COMMUNITY_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.submitHref}
            className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-3 flex flex-col items-center justify-center hover:bg-black/80 transition-all text-center"
          >
            <span className="text-2xl mb-1">{card.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white block">
              {card.label}
            </span>
            <span className="mt-1 text-[9px] text-white/50">დამატება</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
