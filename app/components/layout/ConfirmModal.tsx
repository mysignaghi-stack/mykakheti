import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, message, onConfirm, onClose, loading }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      tabIndex={-1}
      ref={modalRef}
    >
      <div className="bg-slate-900 p-8 rounded-2xl border border-amber-500/30 w-full max-w-sm text-center shadow-2xl">
        <div id="confirm-modal-title" className="mb-6 text-lg font-bold text-white">{message}</div>
        <div className="flex gap-3">
          <button aria-label="გაუქმება" onClick={onClose} className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 text-white transition-all" disabled={loading}>გაუქმება</button>
          <button aria-label="დადასტურება" onClick={async () => { await onConfirm(); onClose(); }} className="flex-1 py-3 bg-amber-600 rounded-xl font-bold hover:bg-amber-500 text-white transition-all shadow-lg flex items-center justify-center" disabled={loading}>
            {loading && <span className="loader mr-2" style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
            დადასტურება
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ConfirmModal;
