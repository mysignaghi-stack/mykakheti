'use client';
import Link from 'next/link';

interface FooterProps {
  onShowAdminLogin?: () => void;
}

export default function Footer({ onShowAdminLogin }: FooterProps) {
  return (
    <footer className="bg-black/60 backdrop-blur-3xl border-t border-white/5 pt-16 md:pt-24 pb-12 px-6 md:px-10 relative z-50 text-left">
      <div className="max-w-[1700px] mx-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 mb-16 sm:mb-20 text-left">
          <div className="space-y-6 text-left">
            <Link href="/" className="text-3xl md:text-4xl font-black italic tracking-tighter">
              mykakheti<span className="text-amber-500">.ge</span>
            </Link>
            <p className="text-white/60 font-bold text-sm leading-relaxed italic max-w-md text-left">
              კახეთის რეგიონის პირველი ერთიანი ციფრული ეკოსისტემა.
            </p>
          </div>
          <div className="space-y-6 text-left">
            <h4 className="text-amber-500 font-black uppercase italic text-[11px] tracking-[0.4em] text-left">კონტაქტი</h4>
            <ul className="space-y-4 font-bold italic text-sm md:text-base text-left">
              <li>📧 INFO@MYKAKHETI.GE</li>
              <li>📍 საქართველო, კახეთი</li>
            </ul>
          </div>
          <div className="space-y-6 text-left">
            <h4 className="text-amber-500 font-black uppercase italic text-[11px] tracking-[0.4em] text-left">ინფორმაცია</h4>
            <ul className="space-y-4 font-black uppercase italic text-[10px] md:text-xs text-left">
              <li><Link href="/rules" className="hover:text-amber-400 transition-colors">საიტის წესები</Link></li>
              <li><Link href="/contact" className="hover:text-amber-400 transition-colors">კონტაქტი</Link></li>
            </ul>
          </div>
        </div>
        <div className="w-full border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] md:text-[11px] font-black uppercase italic text-white/10 tracking-widest text-center md:text-left">
              © 2026 MYKAKHETI.GE. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[9px] md:text-[10px] font-bold italic text-white/20 text-center md:text-left">
              შექმნილია <span className="text-amber-500/40">Kakhi Jaliashvili</span>-ს მიერ
            </p>
          </div>
          <Link href="/admin/login" className="text-[8px] font-black text-white/5 hover:text-amber-500 transition-all uppercase tracking-[1em]">
            Core Access
          </Link>
        </div>
      </div>
    </footer>
  );
}