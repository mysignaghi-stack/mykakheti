import React from 'react';

interface EditAgroModalProps {
  open: boolean;
  item: { name: string } | null;
  newName?: string;
  newPrice: string;
  onChangeName?: (v: string) => void;
  onChange: (v: string) => void;
  details: { place: string; rate: string | number; phone?: string }[];
  onChangeDetails: (v: { place: string; rate: string | number; phone?: string }[]) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading?: boolean;
}

const EditAgroModal: React.FC<EditAgroModalProps> = ({ open, item, newName, newPrice, onChangeName, onChange, details, onChangeDetails, onClose, onSubmit, loading }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    if (open) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [open]);
  if (!open || !item) return null;

  const updateDetail = (idx: number, key: 'place' | 'rate' | 'phone', value: string) => {
    const next = [...details];
    next[idx] = { ...next[idx], [key]: value };
    onChangeDetails(next);
  };

  const addDetail = () => {
    onChangeDetails([...details, { place: '', rate: '', phone: '' }]);
  };

  const removeDetail = (idx: number) => {
    const next = details.filter((_, i) => i !== idx);
    onChangeDetails(next);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" role="dialog" aria-modal="true" tabIndex={-1} ref={modalRef}>
      <div className="bg-slate-900 p-8 rounded-3xl border border-amber-500/30 w-full max-w-sm text-center shadow-2xl">
        <h3 className="text-xl font-bold mb-4 text-white">ფასის ცვლილება / ახალი: <span className="text-amber-500">{item.name}</span></h3>
        <form onSubmit={onSubmit}>
          {typeof onChangeName === 'function' ? (
            <input type="text" value={newName ?? ''} onChange={e => onChangeName(e.target.value)} className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white font-bold mb-3 outline-none focus:border-amber-500 transition-all" placeholder=" ნივთის სახელი (მაგ: ყურძენი)" />
          ) : null}
          <input type="text" value={newPrice} onChange={e => onChange(e.target.value)} className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white font-bold mb-4 outline-none focus:border-amber-500 transition-all text-center text-lg" placeholder="მაგ: 1.50 - 2.00 ₾" autoFocus />

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">მიმღები ობიექტები</p>
              <button type="button" onClick={addDetail} className="text-[11px] px-2 py-1 rounded-lg bg-amber-600 text-white font-black hover:bg-amber-500 transition-all">დამატება +</button>
            </div>
            {details.length === 0 && (
              <p className="text-[11px] text-white/40">ჯერჯერობით ობიექტი დამატებული არ არის.</p>
            )}
            {details.map((d, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                <input
                  value={d.place}
                  onChange={e => updateDetail(idx, 'place', e.target.value)}
                  placeholder="ობიექტი / მდებარეობა"
                  className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-bold outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <input
                    value={d.rate}
                    onChange={e => updateDetail(idx, 'rate', e.target.value)}
                    placeholder="ფასი (მაგ: 1.80 ₾)"
                    className="flex-1 p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-bold outline-none focus:border-amber-500"
                  />
                  <button type="button" onClick={() => removeDetail(idx)} className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-black">✕</button>
                </div>
                <input
                  value={d.phone || ''}
                  onChange={e => updateDetail(idx, 'phone', e.target.value)}
                  placeholder="ტელეფონი"
                  className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-bold outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 text-white transition-all" disabled={loading}>გაუქმება</button>
            <button type="submit" className="flex-1 py-3 bg-amber-600 rounded-xl font-bold hover:bg-amber-500 text-white transition-all shadow-lg flex items-center justify-center" disabled={loading}>
              {loading && <span className="loader mr-2" style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
              შენახვა
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default EditAgroModal;
