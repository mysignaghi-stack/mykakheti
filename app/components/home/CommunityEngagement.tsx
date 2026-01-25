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
    id: 'obituaries',
    title: 'სამძიმარი',
    icon: '🕯️',
    value: 'სამძიმრის დამატება',
    table: 'obituaries',
    fields: ['full_name', 'date_of_death', 'funeral_at', 'funeral_place', 'contacts', 'notes']
  },
  {
    id: 'lost-found',
    title: 'დაკარგული/ნაპოვნი',
    icon: '🔍',
    value: 'დაკარგული/ნაპოვნის დამატება',
    table: 'lost_found',
    fields: ['kind', 'category', 'title', 'description', 'location', 'event_date', 'contact', 'reward', 'reward_note']
  },
  {
    id: 'masters',
    title: 'ოსტატები/სპეციალისტები',
    icon: '🔧',
    value: 'სპეციალისტი/ოსტატი დამატება',
    table: 'masters',
    fields: ['full_name', 'profession', 'category', 'phone', 'location', 'description', 'photo_url', 'service_area', 'price_note']
  },
  {
    id: 'congratulations',
    title: 'მისალოცი ბარათები',
    icon: '🎁',
    value: 'მისალოცი დამატება',
    table: 'congratulations',
    fields: ['sender_name', 'recipient_name', 'message', 'category', 'template', 'toast', 'music_url', 'animation_enabled']
  }
];

export default function CommunityEngagement() {
  const router = useRouter();

  const handleCardClick = (card: CommunityCard) => {
    // Redirect to the appropriate submit page instead of opening modal
    router.push(`/community/${card.id}/submit`);
  };

  return (
    <>
      {/* Main Cards Section */}
      <div className="bg-black/70 backdrop-blur-2xl rounded-[30px] border border-white/10 p-6 shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-white uppercase tracking-[0.1em] mb-3">
            სათემო ჩართულობა
          </h3>
          <p className="text-white/70 text-sm leading-relaxed max-w-2xl mx-auto">
            გააზიარეთ თქვენი სიახლეები, მოძებნეთ საჭირო სპეციალისტები ან გამოხატეთ თანაგრძნობა. თქვენი განცხადება ადმინისტრაციის მიერ გადამოწმების შემდეგ გამოჩნდება საიტის მთავარი გვერდის ზედა სათემო ბარათებში.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMMUNITY_CARDS.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 text-left"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                {card.title}
              </h4>
              <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                {card.value}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}