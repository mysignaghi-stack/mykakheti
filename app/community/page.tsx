'use client';

import Link from 'next/link';

const sections = [
  {
    icon: '🕊️',
    title: 'სამძიმარი',
    description: 'იხილეთ სამძიმრის განცხადებები და გააზიარეთ ინფორმაცია.',
    viewHref: '/community/obituaries',
    addHref: '/community/obituaries/submit',
  },
  {
    icon: '🔎',
    title: 'დაკარგული/ნაპოვნი',
    description: 'მოძებნეთ განცხადება ან დაეხმარეთ პოვნის პროცესში.',
    viewHref: '/community/lost-found',
    addHref: '/community/lost-found/submit',
  },
  {
    icon: '🛠️',
    title: 'ოსტატები/სპეციალისტები',
    description: 'იპოვეთ და დაამატეთ სანდო სპეციალისტები.',
    viewHref: '/community/masters',
    addHref: '/community/masters/submit',
  },
];

export default function CommunityIndex() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარზე დაბრუნება</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-3">სათემო ჩართულობა</h1>
        <p className="text-white/60 text-sm mb-6">გამოქვეყნეთ, გააზიარეთ და მიულოცეთ — აირჩიეთ განყოფილება განცხადებების სანახავად ან დასამატებლად.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sections.map(section => (
            <div key={section.title} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{section.icon}</div>
                <div>
                  <div className="font-black">{section.title}</div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{section.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={section.viewHref} className="flex-1 text-center text-[11px] font-black uppercase rounded-xl border border-white/10 bg-white/5 py-2 hover:border-amber-500 hover:bg-amber-500/10 transition">ნახვა</Link>
                <Link href={section.addHref} className="flex-1 text-center text-[11px] font-black uppercase rounded-xl border border-amber-500/40 bg-amber-500/10 py-2 text-amber-200 hover:border-amber-400 hover:bg-amber-500/20 transition">დამატება</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
