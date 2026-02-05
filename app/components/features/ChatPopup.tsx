'use client';

import React, { useState, useEffect, useRef } from 'react';
import KakhetianSquare from './KakhetianSquare';

interface ChatPopupProps {
  isAdmin: boolean;
  controlToken: string;
}

export default function ChatPopup({ isAdmin, controlToken }: ChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] flex flex-col items-end gap-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        right: '24px',
      }}
    >
      {isOpen && (
        <div
          className="bg-[#0a0a1f] rounded-[28px] shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden animate-in duration-300"
          style={{
            width: 'min(340px, calc(100vw - 48px))',
            height: 'min(500px, 90vh)',
            maxHeight: '90vh',
          }}
        >
          <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-black/30 group"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {isOpen ? <span className="text-xl font-black">✕</span> : <span className="text-3xl animate-pulse">💬</span>}
      </button>
    </div>
  );
}