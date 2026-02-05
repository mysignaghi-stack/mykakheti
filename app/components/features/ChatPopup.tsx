'use client';
  return (
    // 3. რეფს ვაბამთ მთავარ კონტეინერს (ref={popupRef})
    <div ref={popupRef} className="chat-popup">
      
      {/* ჩატის ფანჯარა */}
      {isOpen && (
        <div className="chat-window bg-[#0a0a1f] rounded-[35px] shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
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
    // ივენთის მიბმა
    document.addEventListener('mousedown', handleClickOutside);
    
    // გასუფთავება (როცა კომპონენტი გაითიშება)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    // 3. რეფს ვაბამთ მთავარ კონტეინერს (ref={popupRef})
    <div
      ref={popupRef}
      className="fixed z-[9999] flex flex-col items-end gap-4"
      style={{
        // Respect iOS safe-area and keep a 24px offset
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        right: '24px',
        left: 'auto',
      }}
    >

      {/* ჩატის ფანჯარა */}
      {isOpen && (
        <div
          className="bg-[#0a0a1f] rounded-[28px] shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden animate-in duration-300"
          style={{
            // Ensure the popup never exceeds the viewport on narrow screens
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

      {/* ღილაკი */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-black/30 group"
        style={{
          // keep button above safe area as well
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
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