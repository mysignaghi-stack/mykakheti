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
          className="pointer-events-auto w-full max-w-[360px] rounded-full border border-white/10 bg-amber-600/90 text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl px-4 py-3 flex flex-col items-center justify-center gap-2 font-black text-sm tracking-wide text-center transition-transform active:scale-95"
          aria-label="განცხადება+დამატება"
        >
          <span className="w-10 h-10 rounded-full bg-black/25 border border-white/20 flex items-center justify-center text-2xl leading-none">+</span>
          <span className="truncate">განცხადება+დამატება</span>
        </Link>
      </div>
    </div>
  );
}
