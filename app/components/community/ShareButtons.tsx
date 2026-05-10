'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  className?: string;
  url?: string;
  title?: string;
}

export default function ShareButtons({ className, url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return url || '';
    if (!url) return window.location.href;
    if (/^https?:\/\//.test(url)) return url;
    return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const shareToFacebook = () => {
    const shareUrl = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
    return Boolean(uaData?.mobile) || /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  };

  const shareToTikTok = async () => {
    const shareUrl = getShareUrl();
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // Fall back to copy on share failure or cancel.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
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
        onClick={shareToTikTok}
        className="bg-black/30 text-white/80 px-4 py-2 rounded-xl text-sm border border-white/10 hover:border-white/30 hover:text-white transition"
      >
        {copied ? 'ლინკი დაკოპირდა' : 'ბმულის გაზიარება'}
      </button>
    </div>
  );
}
