'use client';

import { useRouter } from 'next/navigation';

interface CommunityCard {
  id: string;
  title: string;
  icon: string;
  value: string;
  table: string;
  fields: string[];
}

const COMMUNITY_CARDS: CommunityCard[] = [
  {
    id: 'lost-found',
    title: 'დაკარგული/ნაპონის რეესტრი',
    icon: '🔍',
    value: 'დაკარგული/ნაპოვნის დამატება',
    table: 'lost_found',
    fields: ['kind', 'category', 'title', 'description', 'location', 'event_date', 'contact', 'reward', 'reward_note']
  },
  {
    id: 'masters',
    title: 'ხელოსნების/ტექნიკოსების რეესტრი',
    icon: '🔧',
    value: 'სპეციალისტი/ოსტატი დამატება',
    table: 'masters',
    fields: ['full_name', 'profession', 'category', 'phone', 'location', 'description', 'photo_url', 'service_area', 'price_note']
  },
];

export default function CommunityEngagement() {
  const router = useRouter();

  const handleCardClick = (card: CommunityCard) => {
    // Redirect to the appropriate submit page instead of opening modal
    router.push(`/community/${card.id}/submit`);
  };

  return (
    <>
      {/* Main Cards Section - Glassmorphism Design */}
      <div className="relative">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 backdrop-blur-xl rounded-[16px] border border-white/5" />

        <div className="relative p-1">
          <div className="text-center mb-1.5">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] mb-1">
              სათემო ჩართულობა
            </h3>
            <p className="text-white/60 text-[9px] leading-snug max-w-2xl mx-auto">
              გააზიარეთ თქვენი სიახლეები და მოძებნეთ საჭირო სპეციალისტები. თქვენი განცხადება ადმინისტრაციის მიერ გადამოწმების შემდეგ გამოჩნდება საიტის მთავარი გვერდის ზედა სათემო ბარათებში.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
            {COMMUNITY_CARDS.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-white/8 via-white/4 to-white/8 backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/10"
              >
                {/* Inner glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]" />

                {/* Crystal-like structure */}
                <div className="relative p-1.5 flex flex-col items-center justify-center min-h-[56px] text-center">
                  {/* Icon with glass effect */}
                  <div className="relative mb-1.5">
                    <div className="text-lg text-white/80 group-hover:text-white/95 transition-all duration-500 filter drop-shadow-lg">
                      {card.icon}
                    </div>
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 text-lg text-white/20 group-hover:text-white/30 transition-all duration-500 blur-sm">
                      {card.icon}
                    </div>
                  </div>

                  {/* Title with glass text effect */}
                  <h4 className="text-[10px] md:text-[11px] font-bold text-white/90 group-hover:text-white transition-all duration-500 mb-0.5 tracking-wide">
                    {card.title}
                  </h4>

                  {/* Subtitle */}
                  <p className="text-white/50 group-hover:text-white/70 transition-all duration-500 text-[9px] leading-tight">
                    {card.value}
                  </p>
                </div>

                {/* Luminous border effect on hover */}
                <div className="absolute inset-0 rounded-[20px] ring-1 ring-white/0 group-hover:ring-white/20 transition-all duration-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}