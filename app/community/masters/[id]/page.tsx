"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../../types/supabase";
import MasterCard from "../../../components/community/MasterCard";
import ShareButtons from "../../../components/community/ShareButtons";

type MasterRow = Database["public"]["Tables"]["masters"]["Row"];

export default function MasterDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<MasterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [editForm, setEditForm] = useState({
    full_name: "",
    profession: "",
    category: "",
    location: "",
    phone: "",
    description: "",
    price_note: "",
    service_area: "",
    photo_url: "",
  });

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("masters")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      const master = data as MasterRow | null;
      setItem(master ?? null);
      if (master) {
        setEditForm({
          full_name: master.full_name ?? "",
          profession: master.profession ?? "",
          category: master.category ?? "",
          location: master.location ?? "",
          phone: master.phone ?? "",
          description: master.description ?? "",
          price_note: master.price_note ?? "",
          service_area: master.service_area ?? "",
          photo_url: master.photo_url ?? "",
        });
      }
      setLoading(false);
    };
    fetchOne();
  }, [id]);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setCurrentUserId(data.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const isOwner = Boolean(item?.user_id && currentUserId && item.user_id === currentUserId);

  const saveEdit = async () => {
    if (!item || saving) return;
    if (!editForm.full_name || !editForm.profession) {
      alert("გთხოვთ შეავსოთ სახელი/გვარი და სერვისი.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = editForm.photo_url || null;
      if (photoFile) {
        const compressed = await imageCompression(photoFile, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 900,
          useWebWorker: true,
          initialQuality: 0.55,
        });
        const formData = new FormData();
        formData.append("file", compressed, photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "service.jpg");
        formData.append("bucket", "announcements");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadResult?.error || "ფოტოს ატვირთვა ვერ მოხერხდა");
        photoUrl = uploadResult.url || uploadResult.urls?.[0] || null;
      }

      const response = await fetch(`/api/masters/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: { ...editForm, photo_url: photoUrl } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "სერვისის რედაქტირება ვერ მოხერხდა");
      setItem(result.service);
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      setIsEditing(false);
      alert("სერვისი განახლდა და გადაგზავნილია მოდერაციაზე.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "უცნობი შეცდომა";
      alert("შეცდომა: " + message);
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-black text-amber-500 uppercase italic">სერვისი</h1>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">სერვისი ვერ მოიძებნა.</div>
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
          <h1 className="text-2xl font-black text-amber-500 uppercase italic">სერვისის დეტალები</h1>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25"
            >
              {isEditing ? "დახურვა" : "რედაქტირება"}
            </button>
          )}
        </div>
        
        <MasterCard master={item} />

        {isOwner && isEditing && (
          <div className="rounded-[28px] border border-white/10 bg-[#0b0b15] p-5 shadow-2xl md:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-black uppercase text-amber-300">სერვისის რედაქტირება</h2>
              <p className="mt-1 text-xs text-white/45">შენახვის შემდეგ ჩანაწერი ხელახლა გაივლის მოდერაციას.</p>
            </div>
            <div className="space-y-3">
              <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="სახელი და გვარი" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              <input value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} placeholder="სერვისი / პროფესია" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={editForm.category ?? ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="კატეგორია" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
                <input value={editForm.location ?? ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="ლოკაცია" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={editForm.price_note ?? ""} onChange={(e) => setEditForm({ ...editForm, price_note: e.target.value })} placeholder="ფასი ან შეთანხმებით" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
                <input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="ტელეფონი" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              </div>
              <input value={editForm.service_area ?? ""} onChange={(e) => setEditForm({ ...editForm, service_area: e.target.value })} placeholder="მომსახურების არეალი" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              <textarea value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={5} placeholder="აღწერა" className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">ფოტო</div>
                {(photoPreview || editForm.photo_url) && (
                  <div className="relative mb-3 h-40 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image src={photoPreview || editForm.photo_url} alt="" fill sizes="320px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPreview) URL.revokeObjectURL(photoPreview);
                        setPhotoPreview("");
                        setPhotoFile(null);
                        setEditForm({ ...editForm, photo_url: "" });
                      }}
                      className="absolute right-2 top-2 rounded-lg bg-red-600/90 px-2 py-1 text-[10px] font-black uppercase text-white"
                    >
                      წაშლა
                    </button>
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-amber-300/40 hover:text-amber-100">
                  ფოტოს არჩევა
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(file);
                      setPhotoPreview(file ? URL.createObjectURL(file) : "");
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="w-full rounded-2xl bg-amber-600 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "ინახება..." : "ცვლილებების შენახვა"}
              </button>
            </div>
          </div>
        )}

        <ShareButtons className="pt-2" />
      </div>
    </main>
  );
}
