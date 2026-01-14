import React, { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  open: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

const typeColors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-amber-600',
};

export default function Snackbar({ message, open, onClose, type = 'info', duration = 2500 }: SnackbarProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-lg flex items-center gap-3 transition-all animate-in fade-in ${typeColors[type]}`}>
      {type === 'success' && <span>✅</span>}
      {type === 'error' && <span>❌</span>}
      {type === 'info' && <span>ℹ️</span>}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white/60 hover:text-white text-xl font-black">✕</button>
    </div>
  );
}
