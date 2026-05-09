'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type FavoriteButtonProps = {
  announcementId: string;
  className?: string;
  compact?: boolean;
};

const FAVORITES_KEY = 'favorite_announcements';

export default function FavoriteButton({ announcementId, className = '', compact = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const user = data.user;
      setIsAuthed(Boolean(user));
      const favorites = Array.isArray(user?.user_metadata?.[FAVORITES_KEY])
        ? user?.user_metadata?.[FAVORITES_KEY] as string[]
        : [];
      setIsFavorite(favorites.includes(announcementId));
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const favorites = Array.isArray(session?.user?.user_metadata?.[FAVORITES_KEY])
        ? session?.user?.user_metadata?.[FAVORITES_KEY] as string[]
        : [];
      setIsAuthed(Boolean(session?.user));
      setIsFavorite(favorites.includes(announcementId));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [announcementId]);

  const toggleFavorite = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        alert('ფავორიტებში დასამატებლად გაიარეთ ავტორიზაცია.');
        return;
      }

      const current = Array.isArray(user.user_metadata?.[FAVORITES_KEY])
        ? user.user_metadata?.[FAVORITES_KEY] as string[]
        : [];
      const next = current.includes(announcementId)
        ? current.filter((id) => id !== announcementId)
        : [...current, announcementId];

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          [FAVORITES_KEY]: next,
        },
      });
      if (error) throw error;
      setIsFavorite(next.includes(announcementId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      alert('ფავორიტების განახლება ვერ მოხერხდა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite();
      }}
      disabled={loading}
      title={isAuthed ? (isFavorite ? 'ფავორიტებიდან ამოღება' : 'ფავორიტებში დამატება') : 'ფავორიტებისთვის საჭიროა ავტორიზაცია'}
      className={`${compact ? 'h-8 w-8 text-sm' : 'px-4 py-2 text-[10px]'} inline-flex items-center justify-center rounded-xl border font-black uppercase tracking-[0.12em] transition disabled:opacity-60 ${
        isFavorite
          ? 'border-amber-300/60 bg-amber-500/25 text-amber-100'
          : 'border-white/15 bg-black/40 text-white/70 hover:border-amber-300/40 hover:text-amber-100'
      } ${className}`.trim()}
    >
      {compact ? (isFavorite ? '★' : '☆') : (isFavorite ? '★ ფავორიტებშია' : '☆ ფავორიტი')}
    </button>
  );
}
