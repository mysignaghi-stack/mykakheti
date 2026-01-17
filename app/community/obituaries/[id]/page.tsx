"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../../types/supabase";

type ObituaryRow = Database["public"]["Tables"]["obituaries"]["Row"];

export default function ObituaryDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<ObituaryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("obituaries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setItem(data ?? null);
      setLoading(false);
    };
    fetchOne();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
        <div className="max-w-4xl mx-auto">იტვირთება...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-amber-500 uppercase italic">სამძიმარი</h1>
            <Link href="/community/obituaries" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← უკან სიაში</Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">ჩანაწერი ვერ მოიძებნა.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[11px] font-black uppercase text-white/50">სამძიმარი</p>
            <h1 className="text-3xl font-black text-amber-500 uppercase italic mt-1">{item.full_name}</h1>
          </div>
          <Link href="/community/obituaries" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← უკან სიაში</Link>
        </div>

        {item.image_url ? (
          <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-white/10">
            <Image src={item.image_url} alt={item.full_name} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
          </div>
        ) : null}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          {item.date_of_death && (
            <p className="text-white/80 text-sm">გარდაცვალება: {new Date(item.date_of_death).toLocaleDateString("ka-GE")}</p>
          )}
          {item.funeral_at && (
            <p className="text-white/80 text-sm">გასვენება: {new Date(item.funeral_at).toLocaleString("ka-GE")}</p>
          )}
          {item.funeral_place && (
            <p className="text-white/80 text-sm">ადგილი: {item.funeral_place}</p>
          )}
          {item.contacts && (
            <p className="text-white/80 text-sm">კონტაქტი: {item.contacts}</p>
          )}
          {item.notes && (
            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">{item.notes}</p>
          )}
        </div>
      </div>
    </main>
  );
}
