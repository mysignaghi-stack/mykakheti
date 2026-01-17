"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../../types/supabase";

type CongratsRow = Database["public"]["Tables"]["congratulations"]["Row"];

export default function CongratsDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<CongratsRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("congratulations")
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
        <div className="max-w-4xl mx-auto italic opacity-50">იტვირთება...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-white uppercase italic">მისალოცი</h1>
            <Link href="/community/congratulations" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← უკან სიაში</Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 italic text-white/40">ჩანაწერი ვერ მოიძებნა.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-amber-500 uppercase italic">მისალოცი ბარათი</h1>
          <Link href="/community/congratulations" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← უკან სიაში</Link>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
          
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
            {item.image_url ? (
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden border border-white/10 shadow-xl shrink-0">
                <Image src={item.image_url} alt="" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-64 h-64 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shrink-0">🎉</div>
            )}

            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-3xl font-black text-white italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  {item.sender_name || "მეგობარი"} → {item.receiver_name}
                </h2>
                <p className="text-amber-500 font-black uppercase text-xs tracking-widest mt-2">{item.category}</p>
              </div>

              <p className="text-xl text-white/90 leading-relaxed italic font-medium whitespace-pre-wrap">
                "{item.message}"
              </p>

              <div className="pt-4 text-white/40 text-sm font-bold">
                {item.created_at ? new Date(item.created_at).toLocaleDateString("ka-GE") : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
