'use client';

import Link from 'next/link';

export default function CommunityHub() {
  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center relative overflow-hidden transition-all shadow-xl w-full">
      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4 w-full text-left">🤝 სათემო — ჩართულობა</h4>
      <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">გამოქვეყნეთ, გააზიარეთ, დაგიხმარონ</p>
      <div className="grid grid-cols-3 gap-2 w-full">
        <Link href="/community/obituaries/submit" className="bg-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-emerald-500/20 transition-all border border-white/5">
          <span className="text-xl mb-1">🕊️</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-center">სამძიმრის გამოცხადება</span>
        </Link>
        <Link href="/community/lost-found/submit" className="bg-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-emerald-500/20 transition-all border border-white/5">
          <span className="text-xl mb-1">🔎</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-center">დაკარგული/ნაპონის რეესტრი</span>
        </Link>
        <Link href="/community/masters/submit" className="bg-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-emerald-500/20 transition-all border border-white/5">
          <span className="text-xl mb-1">🛠️</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-center">სერვისის დამატება</span>
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 w-full">
        <Link href="/community/obituaries" className="text-[10px] px-3 py-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 text-center">📄 ნახვა</Link>
        <Link href="/community/lost-found" className="text-[10px] px-3 py-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 text-center">📄 ნახვა</Link>
        <Link href="/community/masters" className="text-[10px] px-3 py-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 text-center">📄 ნახვა</Link>
      </div>
    </div>
  );
}
