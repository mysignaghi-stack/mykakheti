'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { onMessageInsert, onMessageDelete, broadcastInsert, broadcastDelete } from '../../lib/squareRealtime';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

// --- Types ---
interface Message {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
  parent_id?: string | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  ip_address?: string;
  fingerprint?: string;
  pending?: boolean;
}

const MESSAGE_LIMIT = 50; 

// --- Emoji Data ---
const EMOJI_TABS = [
  { icon: '🍇', label: 'კახური', list: ['🍇', '🍷', '🏺', '⛰️', '🚜', '⛪', '🌳', '🛖', '🇬🇪', '🍯', '🥖', '🍖', '🔥', '🦅', '🐺', '🐃', '🐎', '🍅', '🥒', '🥩', '🔪', '🎼', '🎹', '🥁'] },
  { icon: '😀', label: 'ემოციები', list: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😙', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '🤔', '🤫', '😐', '😑', '😬', '🙄', '🥱', '😴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '😈', '🤡', '💩', '👻', '💀', '👽', '🤖'] },
  { icon: '👍', label: 'ჟესტები', list: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '👋', '💪', '🙏', '👀', '💋', '❤️', '💔'] },
];

interface KakhetianSquareProps {
  isAdmin: boolean;
  controlToken?: string;
}

export default function KakhetianSquare({ isAdmin, controlToken }: KakhetianSquareProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgName, setMsgName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
  const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const emojiAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ownScrollRef = useRef<HTMLDivElement>(null);
  const audioUnlockedRef = useRef(false);
  const lastTypingSoundRef = useRef(0);

  // (shared realtime subscription used via app/lib/squareRealtime)

  // --- Helpers ---
  const playSound = useCallback(() => {
    if (isSoundOn && audioRef.current) {
        if (!audioReady) {
          try {
            audioRef.current.load();
          } catch {
            // ignore
          }
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.log("Audio prevented:", err));
    }
  }, [isSoundOn, audioReady]);

  const playTypingSound = useCallback(() => {
    if (!isSoundOn || !typingAudioRef.current) return;
    const now = Date.now();
    if (now - lastTypingSoundRef.current < 120) return;
    lastTypingSoundRef.current = now;
    typingAudioRef.current.currentTime = 0;
    typingAudioRef.current.play().catch(() => undefined);
  }, [isSoundOn]);

  const playSendSound = useCallback(() => {
    if (!isSoundOn || !sendAudioRef.current) return;
    sendAudioRef.current.currentTime = 0;
    sendAudioRef.current.play().catch(() => undefined);
  }, [isSoundOn]);

  const playEmojiSound = useCallback(() => {
    playTypingSound();
  }, [playTypingSound]);

  const unlockAudio = useCallback((force = false) => {
    if (audioUnlockedRef.current || !audioRef.current) return;
    if (!force && !isSoundOn) return;
    audioRef.current.muted = false;
    audioRef.current
      .play()
      .then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
        typingAudioRef.current?.play().then(() => {
          typingAudioRef.current?.pause();
          if (typingAudioRef.current) typingAudioRef.current.currentTime = 0;
        }).catch(() => undefined);
        sendAudioRef.current?.play().then(() => {
          sendAudioRef.current?.pause();
          if (sendAudioRef.current) sendAudioRef.current.currentTime = 0;
        }).catch(() => undefined);
        emojiAudioRef.current?.play().then(() => {
          emojiAudioRef.current?.pause();
          if (emojiAudioRef.current) emojiAudioRef.current.currentTime = 0;
        }).catch(() => undefined);
        audioUnlockedRef.current = true;
        setAudioReady(true);
      })
      .catch(() => undefined);
  }, [isSoundOn]);

  const mergeMessages = useCallback((current: Message[], incoming: Message[]) => {
    const map = new Map<string, Message>();
    for (const msg of [...current, ...incoming]) {
      map.set(msg.id, msg);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    // Scroll only the chat container; do not use scrollIntoView to avoid page jumps
    const el = ownScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    if (force || isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: force ? 'auto' : 'smooth' });
    }
  }, []);

  // --- Effects ---

  // 1. Initial Load
  useEffect(() => {
    const savedName = localStorage.getItem('kakheti_username');
    if (savedName) setMsgName(savedName);
    
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.6;
    audioRef.current.muted = false;

    typingAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    typingAudioRef.current.preload = 'auto';
    typingAudioRef.current.volume = 0.25;
    typingAudioRef.current.muted = false;

    sendAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    sendAudioRef.current.preload = 'auto';
    sendAudioRef.current.volume = 0.45;
    sendAudioRef.current.muted = false;

    emojiAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2218/2218-preview.mp3');
    emojiAudioRef.current.preload = 'auto';
    emojiAudioRef.current.volume = 0.3;
    emojiAudioRef.current.muted = false;

    const handleCanPlay = () => setAudioReady(true);
    audioRef.current.addEventListener('canplaythrough', handleCanPlay);
    try {
      audioRef.current.load();
    } catch {
      // ignore
    }

    const checkBan = async () => {
      if (!controlToken) return;
      const { data } = await (supabase as any).from('banned_users').select('*').eq('ip_address', controlToken).single();
      if (data) setIsBanned(true);
    };
    checkBan();

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('square_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MESSAGE_LIMIT);
      if (data) {
        const latest = (data as Message[]).slice().reverse();
        setMessages((prev) => mergeMessages(prev, latest));
        setTimeout(() => scrollToBottom(true), 200);
      }
    };
    fetchMessages();
    
    // ავტომატური წაშლა: ძველი მესიჯების წაშლა თუ რაოდენობა აჭარბებს ლიმიტს
    const cleanupOldMessages = async () => {
      const { data: allMessages } = await (supabase as any).from('square_messages').select('id, created_at').order('created_at', { ascending: false });
      if (allMessages && allMessages.length > MESSAGE_LIMIT) {
        const toDelete = allMessages.slice(MESSAGE_LIMIT).map((m: any) => m.id);
        await (supabase as any).from('square_messages').delete().in('id', toDelete);
      }
    };
    // გაშვება ყოველ 5 წუთში
    const cleanupInterval = setInterval(cleanupOldMessages, 5 * 60 * 1000);
    cleanupOldMessages(); // დაუყოვნებლივ გაშვება
    
    return () => {
      audioRef.current?.removeEventListener('canplaythrough', handleCanPlay);
      clearInterval(cleanupInterval);
    };
  }, [controlToken, scrollToBottom]);

  // 2. REALTIME Subscription (shared)
  useEffect(() => {
    const unsubInsert = onMessageInsert((payload) => {
      const newMsg = payload.new as Message;
      setMessages((prev) => mergeMessages(prev, [newMsg]));
      playSound();
      setTimeout(() => scrollToBottom(true), 60);
    });
    const unsubDelete = onMessageDelete((payload) => {
      setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
    });

    return () => {
      unsubInsert();
      unsubDelete();
    };
  }, [isSoundOn, playSound, scrollToBottom, mergeMessages]);

  // 3. UI Helpers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('.emoji-btn')) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setViewingMedia(null);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // 4. Autoscroll to bottom on messages update (only chat container)
  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(false), 30);
    return () => clearTimeout(t);
  }, [messages, scrollToBottom]);

  // --- Logic Functions ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; 
    if (selectedFiles.length + files.length > 3) return alert("მაქსიმუმ 3 ფაილი.");
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    files.forEach(file => {
        if (file.size > 15 * 1024 * 1024) return alert(`ფაილი ${file.name} დიდია (max 15MB)`);
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          return alert(`ფაილი ${file.name} არ არის მხარდაჭერილი ტიპი. გთხოვთ აირჩიოთ სურათი ან ვიდეო.`);
        }
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
    });
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
      const f = [...selectedFiles]; f.splice(index, 1); setSelectedFiles(f);
      const p = [...filePreviews]; URL.revokeObjectURL(p[index]); p.splice(index, 1); setFilePreviews(p);
  };

  const handleReplySelect = (msg: Message) => {
    setReplyTo(msg);
    setShowEmojis(false);
    setTimeout(() => {
      try {
        // Avoid page scroll when focusing input
        inputRef.current?.focus({ preventScroll: true });
      } catch {
        inputRef.current?.focus();
      }
    }, 0);
  };

  const handleFileUpload = async (file: File) => {
    try {
      let finalFile: File | Blob = file;
      const type = file.type.startsWith('image') ? 'image' : 'video';
      if (type === 'image') {
        try {
          // Sanitize file name to avoid Unicode issues with browser-image-compression
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const sanitizedFile = new File([file], sanitizedName, { type: file.type });
          finalFile = await imageCompression(sanitizedFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 });
        } catch (compressionError) {
          console.warn('Image compression failed, using original file:', compressionError);
          // Fall back to original file if compression fails
          finalFile = file;
        }
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || (type === 'image' ? 'jpg' : 'mp4');
      const fileName = `chat-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const { error } = await supabase.storage
        .from('square-media')
        .upload(fileName, finalFile, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('square-media').getPublicUrl(fileName);
      return { url: data.publicUrl, type };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`ატვირთვა ვერ მოხერხდა: ${error instanceof Error ? error.message : 'უცნობი შეცდომა'}`);
    }
  };

  const postMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) return alert("თქვენ დაბლოკილი ხართ.");
    const trimmedText = msgText.trim();
    if (!msgName || (!trimmedText && selectedFiles.length === 0)) return;
    
    localStorage.setItem('kakheti_username', msgName);
    const tempBase = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nowIso = new Date().toISOString();
    const optimisticMessages: Message[] = [];
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file, index) => {
        const type = file.type.startsWith('image') ? 'image' : 'video';
        optimisticMessages.push({
          id: `${tempBase}-${index}`,
          sender_name: msgName,
          message: index === 0 ? trimmedText : '',
          created_at: nowIso,
          parent_id: replyTo?.id || null,
          fingerprint: controlToken,
          pending: true,
          media_url: filePreviews[index],
          media_type: type,
        });
      });
    } else if (trimmedText) {
      optimisticMessages.push({
        id: tempBase,
        sender_name: msgName,
        message: trimmedText,
        created_at: nowIso,
        parent_id: replyTo?.id || null,
        fingerprint: controlToken,
        pending: true,
      });
    }

    if (optimisticMessages.length > 0) {
      setMessages((prev) => mergeMessages(prev, optimisticMessages));
      try {
        optimisticMessages.forEach((m) => broadcastInsert({ new: m }));
      } catch {}
      requestAnimationFrame(() => scrollToBottom(true));
    }

    playSendSound();

    setIsUploading(true);
    try {
      const uploads = [];
      for (const file of selectedFiles) {
          try {
            const res = await handleFileUpload(file);
            if (res) uploads.push(res);
          } catch (uploadError) {
            console.error('Upload failed for file:', file.name, uploadError);
            // Continue with other files, but show error to user
            alert(`ფაილი ${file.name} ვერ აიტვირთა: ${uploadError instanceof Error ? uploadError.message : 'უცნობი შეცდომა'}`);
          }
      }
      const baseData = {
          sender_name: msgName,
          parent_id: replyTo?.id || null,
          fingerprint: controlToken
      };

      const inserts = [];
      if (uploads.length > 0) {
          inserts.push({ ...baseData, message: trimmedText, media_url: uploads[0].url, media_type: uploads[0].type });
          for (let i = 1; i < uploads.length; i++) {
              inserts.push({ ...baseData, message: '', media_url: uploads[i].url, media_type: uploads[i].type });
          }
      } else {
          inserts.push({ ...baseData, message: trimmedText });
      }

      const response = await fetch('/api/square/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inserts })
      });
      const payload = await response.json().catch(() => ({}));
      const error = response.ok ? null : new Error(payload?.error || 'Send failed');
      const data = payload?.data;

        if (!error && data) {
          setMessages((prev) => {
            const newMsgs = data as Message[];
            if (optimisticMessages.length === 0) return mergeMessages(prev, newMsgs);
            const tempIds = new Set(optimisticMessages.map(m => m.id));
            const base = prev.filter(m => !tempIds.has(m.id));
            return mergeMessages(base, newMsgs);
          });
          try {
            (data as Message[]).forEach((m) => broadcastInsert({ new: m }));
          } catch {}
          requestAnimationFrame(() => scrollToBottom(true));

          // გასუფთავება
          setMsgText(''); setReplyTo(null); setShowEmojis(false);
          filePreviews.forEach(u => URL.revokeObjectURL(u));
          setSelectedFiles([]); setFilePreviews([]);
      } else {
          if (optimisticMessages.length > 0) {
            const tempIds = new Set(optimisticMessages.map(m => m.id));
            setMessages((prev) => prev.filter(m => !tempIds.has(m.id)));
            try {
              optimisticMessages.forEach((m) => broadcastDelete({ old: { id: m.id } }));
            } catch {}
          }
          alert("შეცდომა გაგზავნისას.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('წავშალოთ?')) return;
      await (supabase as any).from('square_messages').delete().eq('id', id);
  };

  const handleBan = async (msg: Message) => {
      const token = msg.fingerprint || msg.ip_address;
      if (!token) return alert('იდენტიფიკატორი ვერ მოიძებნა');
      if (!confirm(`დავბლოკოთ მომხმარებელი? ID: ${token}`)) return;
      await (supabase as any).from('banned_users').insert([{ ip_address: token }]);
      alert("მომხმარებელი დაიბლოკა");
  };

  return (
    <div onPointerDown={() => unlockAudio()} className="flex flex-col h-full w-full bg-slate-950/80 backdrop-blur-3xl rounded-[30px] border border-amber-500/20 shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg">MYK</div>
            <div>
                <h3 className="text-white font-bold uppercase italic text-[10px] tracking-widest">კახური მოედანი</h3>
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] text-green-400 font-bold uppercase">Live</span>
                </div>
            </div>
        </div>
        <button
          onClick={() => {
            setIsSoundOn((prev) => {
              const next = !prev;
              if (next) {
                unlockAudio(true);
              }
              return next;
            });
          }}
          className="text-xl opacity-70 hover:opacity-100 transition-opacity"
        >
            {isSoundOn ? '🔔' : '🔕'}
        </button>
      </div>

      {/* Messages List */}
      <div ref={ownScrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((m) => {
            const isMe = m.sender_name === msgName;
            return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`relative max-w-[85%] p-3 rounded-[20px] shadow-lg border border-white/5 ${isMe ? 'bg-gradient-to-br from-amber-600/30 to-orange-600/30 text-white rounded-tr-sm' : 'bg-[#1a1a1a]/95 text-white rounded-tl-sm'}`}>
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-white/70' : 'text-amber-500'}`}>{m.sender_name}</span>
                            {isAdmin && (m.fingerprint || m.ip_address) && (
                              <span className="text-[7px] text-white/30 font-mono">ID: {m.fingerprint || m.ip_address}</span>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                            <button onClick={() => handleReplySelect(m)} className="text-[10px] text-white/70 hover:text-amber-400" title="პასუხი">↩</button>
                            {isAdmin && (
                              <>
                              <button onClick={() => handleBan(m)} className="text-[10px]" title="Ban User">🚫</button>
                              <button onClick={() => handleDelete(m.id)} className="text-[10px] text-red-400" title="Delete Message">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>

                        {m.media_url && (
                            <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => setViewingMedia({ url: m.media_url!, type: m.media_type! })}>
                                {m.media_type === 'image' ? (
                                  <div className="relative w-full max-h-48 h-48">
                                    <Image src={m.media_url} alt="" fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" onLoad={() => scrollToBottom(true)} />
                                  </div>
                                ) : (
                                  <video src={m.media_url} className="w-full max-h-48" onLoadedData={() => scrollToBottom(true)} />
                                )}
                            </div>
                        )}

                        {m.message && <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>}

                        <div className="flex justify-between items-center mt-2">
                            <span suppressHydrationWarning className="text-[8px] text-white/40 font-mono">
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ka })}
                            </span>
                            {!isMe && <button onClick={() => setReplyTo(m)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↩️</button>}
                        </div>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl shrink-0">
        {replyTo && (
            <div className="flex justify-between bg-amber-500/20 p-2 rounded-lg mb-2 border-l-2 border-amber-500">
                <span className="text-[10px] text-amber-200">პასუხი: {replyTo.sender_name}</span>
                <button onClick={() => setReplyTo(null)} className="text-[10px] text-white">✕</button>
            </div>
        )}

        {filePreviews.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
                {filePreviews.map((src, i) => (
                  <div key={i} className="relative w-12 h-12 shrink-0">
                    <Image src={src} alt="" width={48} height={48} className="w-full h-full object-cover rounded-lg" />
                    <button onClick={() => removeSelectedFile(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">✕</button>
                  </div>
                ))}
            </div>
        )}

        {showEmojis && (
            <div ref={emojiPickerRef} className="absolute bottom-20 left-4 right-4 bg-slate-900 border border-white/10 rounded-2xl p-3 h-48 flex flex-col shadow-2xl z-50">
                <div className="flex gap-2 border-b border-white/10 pb-2 mb-2 overflow-x-auto">
                    {EMOJI_TABS.map((tab, i) => <button key={i} onClick={() => setActiveTab(i)} className={`p-1 rounded ${activeTab === i ? 'bg-white/10' : ''}`}>{tab.icon}</button>)}
                </div>
                <div className="grid grid-cols-6 gap-2 overflow-y-auto flex-1">
                    {EMOJI_TABS[activeTab].list.map((e, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMsgText((p) => p + e);
                          playEmojiSound();
                        }}
                        className="text-xl hover:scale-110"
                      >
                        {e}
                      </button>
                    ))}
                </div>
            </div>
        )}

        <form onSubmit={postMessage} className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input required maxLength={15} value={msgName} onChange={e => setMsgName(e.target.value)} placeholder="სახელი" className="w-20 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white text-center focus:border-amber-500 outline-none" />
                <div className="flex-1 relative">
                    <input
                    ref={inputRef}
                        value={msgText}
                        onChange={e => {
                          setMsgText(e.target.value);
                          playTypingSound();
                        }}
                        placeholder="მიწერე..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey && msgText.trim() && !isUploading && !isBanned) {
                            e.preventDefault();
                            // Find the form and submit
                            const form = (e.target as HTMLElement).closest('form');
                            if (form) {
                              form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                          }
                        }}
                    />
                    <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="absolute right-2 top-1/2 -translate-y-1/2 emoji-btn">😊</button>
                </div>
            </div>
            <div className="flex gap-2">
                <label className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-center flex-1">
                    <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileSelect} ref={fileInputRef} />
                    <span className="text-xs">📷</span>
                </label>
                <button type="submit" disabled={isUploading || isBanned} className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-lg transition-all w-12 flex items-center justify-center">
                    {isUploading ? '...' : '➤'}
                </button>
            </div>
        </form>
      </div>

      {viewingMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewingMedia(null)}>
            <div className="relative w-full max-w-[90vw] h-[90vh]">
              <Image src={viewingMedia.url} alt="" fill sizes="90vw" className="object-contain rounded-2xl shadow-2xl" />
            </div>
        </div>
      )}
    </div>
  );
}