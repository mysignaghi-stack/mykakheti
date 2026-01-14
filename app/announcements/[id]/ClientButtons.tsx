'use client';

import { useState } from 'react';

interface ClientButtonsProps {
  ad: any;
  shareUrl: string;
}

export default function ClientButtons({ ad, shareUrl }: ClientButtonsProps) {
  const [copied, setCopied] = useState(false);

  // 📋 ბმულის კოპირება
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      alert('ბმული კოპირებულია! ✅'); // დავტოვეთ თქვენი ალერტი
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      alert('ბმული კოპირებულია! ✅');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 📱 Facebook Share
  const handleFBShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 'fb-share', 'width=600,height=400');
  };

  // 📞 ტელეფონისა და WhatsApp-ის ფორმატირება
  const cleanPhone = ad.phone ? ad.phone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.startsWith('995') ? cleanPhone : `995${cleanPhone}`;
  // WhatsApp-ის ბმული
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent('გამარჯობა, დავინტერესდი თქვენი განცხადებით: ' + ad.title)}`;

  return (
    <div className="space-y-4 relative z-10 mt-10">
      
      {/* 📞 ძირითადი ღილაკები (ზარი და WhatsApp) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a 
          href={`tel:${ad.phone}`} 
          className="bg-white text-slate-950 py-6 rounded-[25px] font-black uppercase italic text-center text-[12px] shadow-2xl hover:bg-amber-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          📞 დარეკვა: {ad.phone}
        </a>
        <a 
          href={whatsappUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-green-600/10 border border-green-500/20 text-green-500 py-6 rounded-[25px] font-black uppercase italic text-center text-[12px] shadow-2xl hover:bg-green-600 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          WhatsApp 💬
        </a>
      </div>

      {/* 🔗 სოციალური გაზიარება */}
      <div className="grid grid-cols-2 gap-4">
         <button 
           onClick={handleFBShare}
           className="flex items-center justify-center gap-3 bg-blue-600/10 border border-blue-500/20 py-5 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all group"
         >
           <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-white group-hover:text-blue-600 transition-colors">FB</span>
           <span className="text-[10px] font-black uppercase italic">გაზიარება</span>
         </button>

         <button 
           onClick={copyLink}
           className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-5 rounded-[25px] hover:bg-white hover:text-black transition-all group"
         >
           <span className="bg-black text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-black group-hover:text-white transition-colors">
             {copied ? 'OK' : 'TK'}
           </span>
           <span className="text-[10px] font-black uppercase italic">
             {copied ? 'კოპირებულია' : 'ბმულის კოპირება'}
           </span>
         </button>
      </div>
    </div>
  );
}