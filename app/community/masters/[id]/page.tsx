"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../../types/supabase";
import MasterCard from "../../../components/community/MasterCard";

type MasterRow = Database["public"]["Tables"]["masters"]["Row"];

export default function MasterDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<MasterRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("masters")
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
          <div className="flex justify-start">
            <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-amber-500 uppercase italic">ოსტატი/სპეციალისტი</h1>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">ოსტატი/სპეციალისტი ვერ მოიძებნა.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-start">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-amber-500 uppercase italic">ოსტატის/სპეციალისტის პროფილი</h1>
        </div>
        
        <MasterCard master={item} />
      </div>
    </main>
  );
}
