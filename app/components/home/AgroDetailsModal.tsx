import type { AgroItem } from '@/app/lib/types';

interface AgroDetailsModalProps {
  selectedAgro: AgroItem | null;
  onClose: () => void;
}

const AgroDetailsModal = ({ selectedAgro, onClose }: AgroDetailsModalProps) => {
  if (!selectedAgro) return null;

  const details = selectedAgro.details ?? [];

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
          {details.length > 0 ? (
            details.map((detail, idx) => (
              <div
                key={`${detail.place}-${idx}`}
                className="flex justify-between items-center bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left"
              >
                <span className="text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm text-left">
                  {detail.place}
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{detail.rate}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-center bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left">
              <span className="text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm text-left">საშუალო საბაზრო ფასი</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{selectedAgro.price}</span>
            </div>
          )}
        </div>
        <p className="mt-6 text-[11px] sm:text-[12px] text-white/40 leading-relaxed">
          ინფორმაცია განახლდება რეგულარულად; კონკრეტული შეთავაზებები შეიძლება მერყეობდეს ადგილმდებარეობისა და მოცულობის მიხედვით.
        </p>
      </div>
    </div>
  );
};

export default AgroDetailsModal;
