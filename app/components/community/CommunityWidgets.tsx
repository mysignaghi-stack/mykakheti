"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../../types/supabase";

const ROTATE_MS = 3000;

type LostFoundRow = Pick<Database["public"]["Tables"]["lost_found"]["Row"], "id" | "title" | "location" | "image_url" | "kind" | "is_approved" | "created_at">;
type MasterRow = Pick<Database["public"]["Tables"]["masters"]["Row"], "id" | "full_name" | "profession" | "location" | "description" | "rating_avg" | "is_approved" | "created_at">;

type CardConfig = {
  title: string;
  accentClass: string;
  link: string;
  hrefBuilder?: (id: string) => string;
  placeholder: string;
};
interface CommunityWidgetsProps {
  initialLostFound?: LostFoundRow[];
  initialMasters?: MasterRow[];
}

export default function CommunityWidgets({
  initialLostFound = [],
  initialMasters = [],
}: CommunityWidgetsProps) {
  const [lostFound, setLostFound] = useState<LostFoundRow[]>(initialLostFound);
  const [masters, setMasters] = useState<MasterRow[]>(initialMasters);

  const [lfIndex, setLfIndex] = useState(0);
  const [masterIndex, setMasterIndex] = useState(0);

  useEffect(() => {
    setLostFound(initialLostFound);
  }, [initialLostFound]);

  useEffect(() => {
    setMasters(initialMasters);
  }, [initialMasters]);

  useEffect(() => {
    const shouldFetch = [initialLostFound.length, initialMasters.length].some((len) => len === 0);
    if (!shouldFetch) return;

    const fetchData = async () => {
      try {
        const [lfRes, masterRes] = await Promise.all([
          supabase
            .from("lost_found")
            .select("id, title, location, image_url, kind, is_approved, created_at")
            .eq("is_approved", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("masters")
            .select("id, full_name, profession, location, description, rating_avg, is_approved, created_at")
            .eq("is_approved", true)
            .order("created_at", { ascending: false }),
        ]);

        setLostFound(lfRes.data ?? []);
        setMasters(masterRes.data ?? []);
      } catch (error) {
        console.error('Failed to load community widgets', error);
      }
    };

    fetchData();
  }, [initialLostFound.length, initialMasters.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLfIndex((prev) => (lostFound.length ? (prev + 1) % lostFound.length : 0));
      setMasterIndex((prev) => (masters.length ? (prev + 1) % masters.length : 0));
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [lostFound.length, masters.length]);

  useEffect(() => setLfIndex(0), [lostFound.length]);
  useEffect(() => setMasterIndex(0), [masters.length]);

  const cards: CardConfig[] = useMemo(() => ([
    {
      title: "დაკარგული/ნაპოვნი",
      accentClass: "from-amber-700/50 via-black/50 to-amber-900/60",
      link: "/community/lost-found",
      hrefBuilder: (id: string) => `/community/lost-found/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
    {
      title: "ხელოსნები/ტექნიკოსები",
      accentClass: "from-blue-700/45 via-black/50 to-blue-900/60",
      link: "/community/masters",
      hrefBuilder: (id: string) => `/community/masters/${id}`,
      placeholder: "ახალი განცხადებები მალე დაემატება",
    },
  ]), []);

  const currentLostFound = lostFound[lfIndex] ?? null;
  const currentMaster = masters[masterIndex] ?? null;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
      <WidgetCard
        config={cards[0]}
        highlight={currentLostFound}
        badge={currentLostFound ? (currentLostFound.kind === "found" ? "ნაპოვნი" : "დაკარგული") : "დაკარგული/ნაპოვნი"}
        description={currentLostFound?.location || ""}
        title={currentLostFound?.title || cards[0].placeholder}
        meta={currentLostFound?.kind ? (currentLostFound.kind === "found" ? "ნაპოვნი" : "დაკარგული") : undefined}
        href={`/community/lost-found?selectedId=${currentLostFound?.id}`}
        image={currentLostFound?.image_url || undefined}
      />

      <WidgetCard
        config={cards[1]}
        highlight={currentMaster}
        badge={currentMaster ? "ოსტატი/სპეციალისტი" : "ხელოსნები/ტექნიკოსები"}
        description={currentMaster?.location || ""}
        title={currentMaster?.full_name || cards[1].placeholder}
        meta={currentMaster?.profession}
        href={`/community/masters?selectedId=${currentMaster?.id}`}
        image={undefined}
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
      className={`group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${config.accentClass} shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:-translate-y-1 min-h-[120px]`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between text-white/80 text-[11px] font-black uppercase tracking-[0.2em]">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-lg border border-white/10">{badge}</span>
          <span className="text-white/50">Community</span>
        </div>

        <div className="min-h-[50px] space-y-0.5">
          <h3 className="text-sm font-black text-white leading-snug animate-[fade-soft_0.6s_ease] line-clamp-2">{title}</h3>
          {description ? (
            <p className="text-white/70 text-xs line-clamp-2 animate-[fade-soft_0.6s_ease]">{description}</p>
          ) : (
            <p className="text-white/30 text-xs">{hasData ? "" : config.placeholder}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-white/60 text-xs">
          <span className="font-bold truncate max-w-[65%]">{meta || (hasData ? "" : "")}</span>
          {image ? (
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <Image src={image} alt="" fill sizes="56px" className="object-cover" />
            </div>
          ) : (
            <span className="text-white/30">→</span>
          )}
        </div>

        <div className="flex items-center justify-center pt-1 border-t border-white/10 text-[11px] text-white/70 font-black uppercase tracking-widest gap-2">
          <span>გახსენი სრულად</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
