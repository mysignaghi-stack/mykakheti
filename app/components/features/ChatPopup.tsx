'use client';

import React, { useState, useEffect, useRef } from 'react';
import KakhetianSquare from './KakhetianSquare';

interface ChatPopupProps {
  isAdmin: boolean;
  controlToken: string;
}

export default function ChatPopup({ isAdmin, controlToken }: ChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. ვქმნით რეფს, რომელიც მიებმება მთლიან კონტეინერს
  const popupRef = useRef<HTMLDivElement>(null);
  // ჩატის სკროლის კონტეინერის რეფი, გადავაწვდით KakhetianSquare-ს

  // 2. ლოგიკა: თუ დააკლიკეს ელემენტის გარეთ, ვხურავთ პოპაპს
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // თუ პოპაპი ღიაა, რეფი არსებობს და დაკლიკებული ელემენტი რეფის შიგნით არ არის
      if (isOpen && popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // ივენთის მიბმა
    document.addEventListener('mousedown', handleClickOutside);
    
    // გასუფთავება (როცა კომპონენტი გაითიშება)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    // 3. რეფს ვაბამთ მთავარ კონტეინერს (ref={popupRef})
    <div ref={popupRef} className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      
      {/* ჩატის ფანჯარა */}
      {isOpen && (
        <div className="w-[340px] h-[500px] bg-[#0a0a1f] rounded-[35px] shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
           {/* კომპონენტი მთლიანად ავსებს კონტეინერს */}
             <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
        </div>
      )}

      {/* ღილაკი */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-black/30 group"
      >
        {isOpen ? (
          <span className="text-xl font-black">✕</span>
        ) : (
          <span className="text-3xl animate-pulse">💬</span>
        )}
      </button>
    </div>
  );
}