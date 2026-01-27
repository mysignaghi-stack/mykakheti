'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  className?: string;
}

export default function ShareButtons({ className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareToFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const copyForTikTok = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ''}`}>
      <button
        type="button"
        onClick={shareToFacebook}
        className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition"
      >
        Facebook გაზიარება
      </button>
      <button
        type="button"
        onClick={copyForTikTok}
        className="bg-black/30 text-white/80 px-4 py-2 rounded-xl text-sm border border-white/10 hover:border-white/30 hover:text-white transition"
      >
        {copied ? 'ლინკი დაკოპირდა' : 'ლინკის კოპირება'}
      </button>
    </div>
  );
}
