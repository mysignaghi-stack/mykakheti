import { useState } from 'react';
import type { AgroItem } from '@/app/lib/types';

interface AgroDetailsModalProps {
  selectedAgro: AgroItem | null;
  onClose: () => void;
}

const AgroDetailsModal = ({ selectedAgro, onClose }: AgroDetailsModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!selectedAgro) return null;

  const details = selectedAgro.details ?? [];
  const normalizedDetails = details.map((detail) =>
    typeof detail === 'string'
      ? { place: detail, rate: selectedAgro.price, phone: '' }
      : { phone: '', ...detail }
  );

  const formatRate = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '';
    const text = String(value)
      .trim()
      .replace(/₾/g, 'GEL')
      .replace(/\bgel\b/gi, 'GEL')
      .replace(/\bGEL(?:\s+GEL)+\b/g, 'GEL')
      .replace(/\s*ლ\s*(?=$|GEL|gel|₾)/g, ' ')
      .replace(/(\d)\s*ლ\b/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return /\bGEL\b/i.test(text) ? text : `${text} GEL`;
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#agro-item-${encodeURIComponent(String(selectedAgro.id))}`
    : '';

  const shareToFacebook = () => {
    if (!shareUrl) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 'fb-share', 'width=600,height=400');
  };

  const copyOrNativeShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: selectedAgro.name, url: shareUrl });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300 text-left"
      role="dialog"
      aria-modal="true"
      aria-label="აგრო დეტალები"
    >
      <div className="bg-[#0a0a1f] p-8 sm:p-10 rounded-[40px] sm:rounded-[50px] border border-white/10 w-full max-w-lg shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/30 hover:text-white transition-colors text-xl sm:text-2xl font-black"
          aria-label="დახურვა"
        >
          ✕
        </button>
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <span className="text-5xl sm:text-6xl mb-4 drop-shadow-2xl">{selectedAgro.icon}</span>
          <h2
            className={`text-3xl sm:text-4xl font-black uppercase italic tracking-tighter ${selectedAgro.color} drop-shadow-lg text-center`}
          >
            {selectedAgro.name}
          </h2>
          <p className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mt-3 text-center">
            მიმღები პუნქტები
          </p>
          <p className="text-[11px] sm:text-[12px] text-white/50 font-semibold mt-2 leading-snug">
            ფასები არის საორიენტაციო ხასიათის და შეიძლება შეიცვალოს; დეტალები ასახავს ბოლო დაფიქსირებულ ობიექტებს.
          </p>
        </div>
        <div className="space-y-4">
          {normalizedDetails.length > 0 ? (
            normalizedDetails.map((detail, idx) => (
              <div
                key={`${detail.place}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left"
              >
                <div className="space-y-1">
                  <span className="block text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm">
                    {detail.place}
                  </span>
                  {detail.phone && (
                    <span className="block text-[11px] sm:text-[12px] text-white/60 font-bold">📞 {detail.phone}</span>
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{formatRate(detail.rate)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-center bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left">
              <span className="text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm text-left">საშუალო საბაზრო ფასი</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{formatRate(selectedAgro.price)}</span>
            </div>
          )}
        </div>
        <p className="mt-6 text-[11px] sm:text-[12px] text-white/40 leading-relaxed">
          ინფორმაცია განახლდება რეგულარულად; კონკრეტული შეთავაზებები შეიძლება მერყეობდეს ადგილმდებარეობისა და მოცულობის მიხედვით.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={shareToFacebook}
            className="rounded-xl bg-blue-600/20 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-600 hover:text-white"
          >
            Facebook გაზიარება
          </button>
          <button
            type="button"
            onClick={copyOrNativeShare}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
          >
            {copied ? 'ბმული დაკოპირდა' : 'გაზიარება'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgroDetailsModal;
