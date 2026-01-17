'use client';

import Link from 'next/link';
import CongratulationsSection from './CongratulationsSection';

export default function CommunityEngagementSection() {
  return (
    <section className="relative z-20 w-full px-4 sm:px-6 md:px-10 max-w-[1800px] mx-auto mt-10">
      <div className="bg-black/70 backdrop-blur-3xl rounded-[30px] p-4 md:p-6 shadow-3xl border border-white/10">
        <h4 className="text-white font-black uppercase tracking-[0.4em] mb-1 w-full text-center">სათემო ჩართულობა</h4>
        <p className="w-full text-white font-bold uppercase tracking-[0.2em] mb-3 leading-tight text-center">
          გამოქვეყნეთ, გააზიარეთ და მიულოცეთ
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          <div className="flex flex-col gap-0.5">
            <Link
              href="/community/obituaries/submit"
              className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all"
            >
              <span className="text-2xl mb-0.5">🕊️</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">
                სამძიმრის გამოცხადება
              </span>
            </Link>
            <Link
              href="/community/obituaries"
              className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold"
            >
              📄 ნახვა
            </Link>
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/community/lost-found/submit"
              className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all"
            >
              <span className="text-2xl mb-0.5">🔎</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">
                დაკარგული/ნაპოვნი
              </span>
            </Link>
            <Link
              href="/community/lost-found"
              className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold"
            >
              📄 ნახვა
            </Link>
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/community/masters/submit"
              className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all"
            >
              <span className="text-2xl mb-0.5">🛠️</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">
                ოსტატის დამატება
              </span>
            </Link>
            <Link
              href="/community/masters"
              className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold"
            >
              📄 ნახვა
            </Link>
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/community/congratulations/submit"
              className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all"
            >
              <span className="text-2xl mb-0.5">🎉</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">
                მისალოცი ბარათი
              </span>
            </Link>
            <Link
              href="/community/congratulations"
              className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold"
            >
              📄 ნახვა
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <CongratulationsSection />
        </div>
      </div>
    </section>
  );
}
