'use client';

import Link from 'next/link';

export default function CommunityIndex() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">სათემო სივრცე</h1>
        <p className="text-white/60 text-sm mb-6">აირჩიეთ თქვენთვის სასურველი განყოფილება ან გამოაგზავნეთ შეკვეთა მოდერაციაზე დასამტკიცებლად.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/community/obituaries" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-2xl mb-1">🕊️</div>
            <div className="font-black">სამძიმარი</div>
            <div className="text-[11px] text-white/50">ნახვა და გამოქვეყნება</div>
          </Link>
          <Link href="/community/lost-found" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-2xl mb-1">🔎</div>
            <div className="font-black">დაკარგული/ნაპოვნი</div>
            <div className="text-[11px] text-white/50">ფილტრი და გამოქვეყნება</div>
          </Link>
          <Link href="/community/masters" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-2xl mb-1">🛠️</div>
            <div className="font-black">ოსტატები</div>
            <div className="text-[11px] text-white/50">ბაზა და შეფასება</div>
          </Link>
        </div>

        <h2 className="mt-8 mb-3 text-sm text-white/60 font-black uppercase tracking-widest">გაგზავნა მოდერაციაზე</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/community/obituaries/submit" className="p-3 rounded-xl bg-emerალd-600/10 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/20 transition text-sm">
            🕊️ სამძიმრის გამოცხადება
          </Link>
          <Link href="/community/lost-found/submit" className="p-3 rounded-xl bg-emerald-600/10 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/20 transition text-sm">
            🔎 დაკარგული/ნაპოვნის გამოქვეყნება
          </Link>
          <Link href="/community/masters/submit" className="p-3 rounded-xl bg-emerald-600/10 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/20 transition text-sm">
            🛠️ ოსტატის დამატება
          </Link>
        </div>
      </div>
    </main>
  );
}
