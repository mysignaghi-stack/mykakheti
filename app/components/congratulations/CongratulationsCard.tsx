'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Database } from '../../../types/supabase';

type CongratsRow = Database["public"]["Tables"]["congratulations"]["Row"];

interface CongratulationsCardProps {
  item: CongratsRow;
  isPreview?: boolean;
}

export default function CongratulationsCard({ item, isPreview = false }: CongratulationsCardProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  const triggerAnimation = () => {
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 3000);
  };

  const renderTemplate = () => {
    const baseClasses = "bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden";
    const content = (
      <>
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
          {item.image_url ? (
            <div className="relative w-64 h-64 rounded-3xl overflow-hidden border border-white/10 shadow-xl shrink-0">
              <Image src={item.image_url} alt="" fill className="object-contain rounded-2xl" />
              {/* Kakhetian ornament frame */}
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-2xl pointer-events-none" />
              <div className="absolute inset-2 border border-amber-600/20 rounded-xl pointer-events-none" />
            </div>
          ) : (
            <div className="w-64 h-64 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shrink-0">🎉</div>
          )}

          <div className="space-y-6 flex-1">
            <div>
              <h2 className="text-3xl font-black text-white italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {item.sender_name || "მეგობარი"} → {item.recipient_name}
              </h2>
              <p className="text-amber-500 font-black uppercase text-xs tracking-widest mt-2">{item.occasion}</p>
            </div>

            <p className="text-xl text-white/90 leading-relaxed italic font-medium whitespace-pre-wrap">
              "{item.message}"
            </p>

            <div className="pt-4 text-white/40 text-sm font-bold">
              {item.created_at ? new Date(item.created_at).toLocaleDateString("ka-GE") : ""}
            </div>
          </div>
        </div>

        {/* Animation button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={triggerAnimation}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
          >
            🥂 ჭიქების მიჭახუნება
          </button>
        </div>

      </>
    );

    switch ('თანამედროვე მინიმალიზმი' as 'თანამედროვე მინიმალიზმი' | 'ძველი პერგამენტი' | 'ბუნების სუნთქვა' | 'სადღეგრძელოს ბარათი') {
      case 'ძველი პერგამენტი':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-amber-900/20 via-yellow-900/10 to-amber-800/20 border-amber-500/30`}>
            {/* Parchment texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZmZmZmZiIvPgo8L3N2Zz4K')] bg-repeat" />
            <div className="relative z-10 font-serif">
              {content}
            </div>
          </div>
        );

      case 'ბუნების სუნთქვა':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-green-800/20 border-green-500/30`}>
            {/* Nature background overlay */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-green-800/20 via-transparent to-blue-800/20" />
            <div className="absolute top-4 right-4 text-6xl opacity-20">🌿</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-20">🏔️</div>
            <div className="relative z-10">
              {content}
            </div>
          </div>
        );

      case 'სადღეგრძელოს ბარათი':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-purple-900/20 via-red-900/10 to-purple-800/20 border-purple-500/30`}>
            {/* Wine glass shape styling */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-transparent via-amber-500/20 to-amber-600/30 rounded-t-full" />
            <div className="relative z-10">
              {content}
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-4xl opacity-30">🍷</div>
          </div>
        );

      case 'თანამედროვე მინიმალიზმი':
      default:
        return (
          <div className={baseClasses}>
            {content}
          </div>
        );
    }
  };

  return (
    <>
      {renderTemplate()}

      {/* Animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center space-y-8">
            <div className="text-6xl animate-bounce">🥂</div>
            <div className="text-4xl animate-pulse">🎉</div>
            <div className="text-2xl text-amber-400 font-bold animate-pulse">გილოცავთ!</div>
            <div className="flex justify-center gap-4 text-4xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>🍷</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🍷</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🍷</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}