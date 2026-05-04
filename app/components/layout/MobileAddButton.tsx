"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileAddButton() {
  const pathname = usePathname();

  if (pathname === '/add') {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[3000] flex justify-center md:hidden pointer-events-none">
      <div className="w-full px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] flex justify-center pointer-events-none">
        <Link
          href="/add"
          className="pointer-events-auto w-full max-w-[300px] rounded-full border border-white/50 bg-gradient-to-b from-white/55 via-white/40 to-white/30 text-black shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-2xl px-3 py-1.5 flex items-center justify-center font-black text-xs tracking-wide text-center transition-transform active:scale-95"
          style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.28), 0 0 18px rgba(255,255,255,0.25), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(255,255,255,0.2)' }}
          aria-label="განცხადება+დამატება"
        >
          <span className="flex items-center gap-2">
            <span>განცხადება</span>
            <span className="text-lg leading-none">+</span>
            <span>დამატება</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
