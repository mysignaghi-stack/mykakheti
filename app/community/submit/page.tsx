'use client';

import Link from 'next/link';

const sections = [
  {
    icon: '🔎',
    title: 'დაკარგული/ნაპოვნი',
    description: 'დაკარგული/ნაპოვნი განცხადების დამატება.',
    addHref: '/community/lost-found/submit',
  },
  {
    icon: '🛠️',
    title: 'ოსტატები/სპეციალისტები',
    description: 'ოსტატის ან სპეციალისტის დამატება.',
    addHref: '/community/masters/submit',
  },
];

export default function CommunitySubmitIndex() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between mb-4">
          <Link href="/community" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← სათემო ჩართულობა</Link>
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარზე დაბრუნება</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-3">სათემო ჩართულობის განცხადების დამატება</h1>
        <p className="text-white/60 text-sm mb-6">აირჩიეთ განყოფილება განცხადების დასამატებლად.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.addHref}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{section.icon}</div>
                <div>
                  <div className="font-black">{section.title}</div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{section.description}</p>
                </div>
              </div>
              <div className="text-[11px] font-black uppercase rounded-xl border border-amber-500/40 bg-amber-500/10 py-2 text-amber-200 text-center hover:border-amber-400 hover:bg-amber-500/20 transition">
                დამატება
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
