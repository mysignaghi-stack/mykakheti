"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../../types/supabase";

const ROTATE_MS = 3000;

type ObituaryRow = Pick<Database["public"]["Tables"]["obituaries"]["Row"], "id" | "full_name" | "funeral_at" | "funeral_place" | "image_url" | "is_approved" | "created_at">;
type LostFoundRow = Pick<Database["public"]["Tables"]["lost_found"]["Row"], "id" | "title" | "location" | "image_url" | "kind" | "is_approved" | "resolved" | "created_at">;
type MasterRow = Pick<Database["public"]["Tables"]["masters"]["Row"], "id" | "full_name" | "profession" | "location" | "photo_url" | "rating_avg" | "is_approved" | "created_at">;
type CongratsRow = Pick<Database["public"]["Tables"]["congratulations"]["Row"], "id" | "sender_name" | "receiver_name" | "message" | "image_url" | "status" | "created_at">;

type CardConfig = {
  title: string;
  accentClass: string;
  link: string;
  hrefBuilder?: (id: string) => string;
  placeholder: string;
};

export default function CommunityWidgets() {
  const [obituaries, setObituaries] = useState<ObituaryRow[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundRow[]>([]);
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [congrats, setCongrats] = useState<CongratsRow[]>([]);

  const [obIndex, setObIndex] = useState(0);
  const [lfIndex, setLfIndex] = useState(0);
  const [masterIndex, setMasterIndex] = useState(0);
  const [congratsIndex, setCongratsIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [obRes, lfRes, masterRes, congratsRes] = await Promise.all([
        supabase
          .from("obituaries")
          .select("id, full_name, funeral_at, funeral_place, image_url, is_approved, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("lost_found")
          .select("id, title, location, image_url, kind, is_approved, resolved, created_at")
          .eq("is_approved", true)
          .eq("resolved", false)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("masters")
          .select("id, full_name, profession, location, photo_url, rating_avg, is_approved, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("congratulations")
          .select("id, sender_name, receiver_name, message, image_url, status, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setObituaries(obRes.data ?? []);
      setLostFound(lfRes.data ?? []);
      setMasters(masterRes.data ?? []);
      setCongrats(congratsRes.data ?? []);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setObIndex((prev) => (obituaries.length ? (prev + 1) % obituaries.length : 0));
      setLfIndex((prev) => (lostFound.length ? (prev + 1) % lostFound.length : 0));
      setMasterIndex((prev) => (masters.length ? (prev + 1) % masters.length : 0));
      setCongratsIndex((prev) => (congrats.length ? (prev + 1) % congrats.length : 0));
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [obituaries.length, lostFound.length, masters.length, congrats.length]);

  useEffect(() => setObIndex(0), [obituaries.length]);
  useEffect(() => setLfIndex(0), [lostFound.length]);
  useEffect(() => setMasterIndex(0), [masters.length]);
  useEffect(() => setCongratsIndex(0), [congrats.length]);

  const cards: CardConfig[] = useMemo(() => ([
    {
      title: "სამძიმარი",
      accentClass: "from-gray-400/30 via-slate-900/60 to-white/10",
      link: "/community/obituaries",
      hrefBuilder: (id: string) => `/community/obituaries/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
    {
      title: "დაკარგული/ნაპოვნი",
      accentClass: "from-amber-700/50 via-black/50 to-amber-900/60",
      link: "/community/lost-found",
      hrefBuilder: (id: string) => `/community/lost-found/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
    {
      title: "ოსტატები",
      accentClass: "from-blue-700/45 via-black/50 to-blue-900/60",
      link: "/community/masters",
      hrefBuilder: (id: string) => `/community/masters/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
    {
      title: "მისალოცები",
      accentClass: "from-rose-600/40 via-black/60 to-amber-500/40",
      link: "/community/congratulations",
      hrefBuilder: (id: string) => `/community/congratulations/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
  ]), []);

  const currentObituary = obituaries[obIndex] ?? null;
  const currentLostFound = lostFound[lfIndex] ?? null;
  const currentMaster = masters[masterIndex] ?? null;
  const currentCongrats = congrats[congratsIndex] ?? null;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <WidgetCard
        config={cards[0]}
        highlight={currentObituary}
        badge="სამძიმარი"
        description={currentObituary ? currentObituary.funeral_place || "" : ""}
        title={currentObituary?.full_name || cards[0].placeholder}
        meta={currentObituary?.funeral_at ? new Date(currentObituary.funeral_at).toLocaleDateString("ka-GE") : undefined}
        href={currentObituary?.id ? cards[0].hrefBuilder?.(currentObituary.id) ?? cards[0].link : cards[0].link}
        image={currentObituary?.image_url || undefined}
      />

      <WidgetCard
        config={cards[1]}
        highlight={currentLostFound}
        badge={currentLostFound ? (currentLostFound.kind === "found" ? "ნაპოვნი" : "დაკარგული") : "დაკარგული/ნაპოვნი"}
        description={currentLostFound?.location || ""}
        title={currentLostFound?.title || cards[1].placeholder}
        meta={currentLostFound?.kind ? (currentLostFound.kind === "found" ? "ნაპოვნი" : "დაკარგული") : undefined}
        href={currentLostFound?.id ? cards[1].hrefBuilder?.(currentLostFound.id) ?? cards[1].link : cards[1].link}
        image={currentLostFound?.image_url || undefined}
      />

      <WidgetCard
        config={cards[2]}
        highlight={currentMaster}
        badge={currentMaster ? "ოსტატი" : "ოსტატები"}
        description={currentMaster?.location || ""}
        title={currentMaster?.full_name || cards[2].placeholder}
        meta={currentMaster?.profession}
        href={currentMaster?.id ? cards[2].hrefBuilder?.(currentMaster.id) ?? cards[2].link : cards[2].link}
        image={currentMaster?.photo_url || undefined}
      />

      <WidgetCard
        config={cards[3]}
        highlight={currentCongrats}
        badge="მისალოცი"
        description={currentCongrats ? `${currentCongrats.sender_name || ""} → ${currentCongrats.receiver_name || ""}` : ""}
        title={currentCongrats?.message || cards[3].placeholder}
        meta={currentCongrats?.status}
        href={currentCongrats?.id ? cards[3].hrefBuilder?.(currentCongrats.id) ?? cards[3].link : cards[3].link}
        image={currentCongrats?.image_url || undefined}
      />
    </div>
  );
}

interface WidgetCardProps {
  config: CardConfig;
  title: string;
  description?: string;
  meta?: string;
  href: string;
  image?: string;
  badge: string;
  highlight: unknown;
}

function WidgetCard({ config, title, description, meta, href, image, badge, highlight }: WidgetCardProps) {
  const hasData = Boolean(highlight);

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${config.accentClass} shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-white/80 text-[11px] font-black uppercase tracking-[0.2em]">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-lg border border-white/10">{badge}</span>
          <span className="text-white/50">Community</span>
        </div>

        <div className="min-h-[82px] space-y-1">
          <h3 className="text-base font-black text-white leading-tight animate-[fade-soft_0.6s_ease] line-clamp-2">{title}</h3>
          {description ? (
            <p className="text-white/70 text-sm line-clamp-2 animate-[fade-soft_0.6s_ease]">{description}</p>
          ) : (
            <p className="text-white/30 text-sm">{hasData ? "" : config.placeholder}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-white/60 text-xs">
          <span className="font-bold truncate max-w-[70%]">{meta || (hasData ? "" : "")}</span>
          {image ? (
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <Image src={image} alt="" fill sizes="40px" className="object-cover" />
            </div>
          ) : (
            <span className="text-white/30">→</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[12px] text-white/70 font-black uppercase tracking-widest">
          <span>გახსენი სრულად</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
