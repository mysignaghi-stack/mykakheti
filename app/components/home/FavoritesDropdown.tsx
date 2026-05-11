"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Database } from "@/types/supabase";

type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

const FAVORITES_KEY = "favorite_announcements";

export default function FavoritesDropdown() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);

  const favoriteKey = useMemo(() => favoriteIds.join(","), [favoriteIds]);

  useEffect(() => {
    let active = true;

    const readUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const user = data.user;
      const favorites = Array.isArray(user?.user_metadata?.[FAVORITES_KEY])
        ? user?.user_metadata?.[FAVORITES_KEY] as string[]
        : [];
      setIsAuthed(Boolean(user));
      setFavoriteIds(favorites);
    };

    readUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const favorites = Array.isArray(session?.user?.user_metadata?.[FAVORITES_KEY])
        ? session?.user?.user_metadata?.[FAVORITES_KEY] as string[]
        : [];
      setIsAuthed(Boolean(session?.user));
      setFavoriteIds(favorites);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      if (!favoriteIds.length) {
        setItems([]);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .in("id", favoriteIds)
        .eq("is_approved", true)
        .eq("is_archived", false);

      if (!active) return;
      const rows = (data ?? []) as AnnouncementRow[];
      setItems(favoriteIds.map((id) => rows.find((row) => row.id === id)).filter(Boolean) as AnnouncementRow[]);
      setLoading(false);
    };

    loadFavorites();

    return () => {
      active = false;
    };
  }, [favoriteKey, favoriteIds]);

  return (
    <div className="fixed bottom-20 right-4 z-[1100] sm:bottom-auto sm:right-5 sm:top-24">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/35 bg-black/65 text-lg text-amber-200 shadow-[0_12px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-amber-200 hover:bg-amber-500/20"
        title="ფავორიტები"
        aria-label="ფავორიტები"
      >
        ★
        {favoriteIds.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-black">
            {favoriteIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-3 w-[min(86vw,22rem)] overflow-hidden rounded-[24px] border border-white/10 bg-[#080812]/95 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:static sm:mt-3 sm:mb-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">ფავორიტები</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] font-black uppercase text-white/40 transition hover:text-white"
            >
              დახურვა
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto p-3">
            {!isAuthed ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-relaxed text-white/60">
                ფავორიტების სანახავად გაიარეთ ავტორიზაცია.
              </div>
            ) : loading ? (
              <div className="p-4 text-xs font-bold text-white/45">იტვირთება...</div>
            ) : items.length ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const image = Array.isArray(item.all_images) && item.all_images[0] ? item.all_images[0] : item.image_url;
                  return (
                    <Link
                      key={item.id}
                      href={`/announcements/${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 transition hover:border-amber-300/35 hover:bg-white/[0.07]"
                    >
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                        {image ? (
                          <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/20">★</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-white">{item.title}</p>
                        <p className="mt-1 truncate text-[10px] text-white/45">{item.location}</p>
                        <p className="mt-1 text-[11px] font-black text-amber-300">
                          {item.price} {item.currency === "USD" ? "$" : "₾"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-relaxed text-white/60">
                ფავორიტებში დამატებული განცხადებები აქ გამოჩნდება.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
