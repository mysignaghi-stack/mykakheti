'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="relative z-[100] px-4 sm:px-6 md:px-10 py-5 sm:py-6 flex items-center bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <Link href="/" className="text-2xl md:text-3xl font-black italic tracking-tighter shrink-0">
        mykakheti<span className="text-amber-500">.ge</span>
      </Link>
      
      {/* Test Mode Message */}
      <div className="flex-1 flex justify-center items-center px-4">
        <div className="text-center">
          <div className="text-red-500 font-black text-base md:text-lg uppercase tracking-widest animate-pulse">
            საიტი მუშაობს სატესტო რეჟიმში
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 md:gap-4 items-center shrink-0 relative">
        <Link href="/add" className="bg-amber-600 text-white px-5 sm:px-10 py-3 rounded-xl font-black uppercase text-[10px] md:text-[11px] italic shadow-2xl hover:scale-105 transition-all">
          განცხადება +
        </Link>
      </div>
    </nav>
  );
}