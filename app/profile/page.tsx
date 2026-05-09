"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import type { Database } from "@/types/supabase";
import AnnouncementCard from "@/app/components/home/AnnouncementCard";

type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type MasterRow = Database["public"]["Tables"]["masters"]["Row"];

const FAVORITES_KEY = "favorite_announcements";
const PUBLISH_ACTIONS = [
  { title: "ჩვეულებრივი განცხადება", href: "/add", text: "იყიდება, ქირავდება, მომსახურება ან სხვა განცხადება" },
  { title: "სერვისი / მიმწოდებელი", href: "/community/masters/submit", text: "ხელოსანი, ტექნიკოსი, მძღოლი, მასწავლებელი და სხვა" },
  { title: "დაკარგული / ნაპოვნი", href: "/community/lost-found/submit", text: "დაკარგული ან ნაპოვნი ნივთის/ცხოველის ინფორმაცია" },
  { title: "მილოცვა", href: "/community/congratulations/submit", text: "მისალოცი განცხადება და ფოტო" },
  { title: "სამძიმარი", href: "/community/obituaries/submit", text: "საზოგადოებრივი განცხადება სამძიმრისთვის" },
];

type ProfileContentResponse = {
  announcements?: AnnouncementRow[];
  services?: MasterRow[];
  error?: string;
};

function getDisplayName(user: User | null) {
  if (!user) return "";
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name || metadata.name;
  const firstName = metadata.first_name;
  const lastName = metadata.last_name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof firstName === "string" || typeof lastName === "string") {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
  }
  return user.email ?? "მომხმარებელი";
}

function getStatusLabel(announcement: AnnouncementRow) {
  if (announcement.is_archived) return "არქივშია";
  if (announcement.is_approved) return "გამოქვეყნებულია";
  return "მოდერაციაზეა";
}

function getMasterStatusLabel(master: MasterRow) {
  return master.is_approved ? "გამოქვეყნებულია" : "მოდერაციაზეა";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myAnnouncements, setMyAnnouncements] = useState<AnnouncementRow[]>([]);
  const [myServices, setMyServices] = useState<MasterRow[]>([]);
  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setMyAnnouncements([]);
        setMyServices([]);
        setFavoriteAnnouncements([]);
        return;
      }

      const favorites = Array.isArray(currentUser.user_metadata?.[FAVORITES_KEY])
        ? currentUser.user_metadata[FAVORITES_KEY] as string[]
        : [];

      const [profileContentResult, favoriteResult] = await Promise.all([
        fetch("/api/profile/content", { cache: "no-store" }).then(async (response) => {
          const payload = await response.json().catch(() => ({})) as ProfileContentResponse;
          if (!response.ok) throw new Error(payload.error || "პროფილის მონაცემები ვერ ჩაიტვირთა");
          return payload;
        }),
        favorites.length
          ? supabase
              .from("announcements")
              .select("*")
              .in("id", favorites)
              .eq("is_approved", true)
              .eq("is_archived", false)
          : Promise.resolve({ data: [] as AnnouncementRow[], error: null }),
      ]);

      if (favoriteResult.error) throw favoriteResult.error;

      setMyAnnouncements(profileContentResult.announcements ?? []);
      setMyServices(profileContentResult.services ?? []);
      setFavoriteAnnouncements((favoriteResult.data ?? []) as AnnouncementRow[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "უცნობი შეცდომა";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#050510] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-300">პროფილი</p>
            <h1 className="mt-1 truncate text-2xl font-black uppercase italic sm:text-3xl">
              {user ? getDisplayName(user) : "ჩემი გვერდი"}
            </h1>
            {user?.email ? <p className="mt-1 truncate text-sm text-white/50">{user.email}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/add"
              className="rounded-2xl bg-amber-500 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
            >
              განცხადების დამატება
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white/75 transition hover:border-amber-300/40 hover:text-white"
            >
              მთავარი
            </Link>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl border border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white/75 transition hover:border-red-300/40 hover:text-red-100"
              >
                გამოსვლა
              </button>
            ) : null}
          </div>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">იტვირთება...</div>
        ) : !user ? (
          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <h2 className="text-lg font-black uppercase italic text-amber-200">საჭიროა ავტორიზაცია</h2>
            <p className="mt-2 text-sm text-white/70">პროფილის სანახავად გთხოვთ შეხვიდეთ ანგარიშში.</p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-2xl bg-amber-500 px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
            >
              შესვლა
            </Link>
          </section>
        ) : (
          <>
            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>
            ) : null}

            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <div>
                <h2 className="text-xl font-black uppercase italic">გამოქვეყნება</h2>
                <p className="mt-1 text-sm text-white/50">აირჩიეთ საიტის ის განყოფილება, სადაც გსურთ ინფორმაციის დამატება.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PUBLISH_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-2xl border border-white/10 bg-[#0b0b15]/80 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]"
                  >
                    <h3 className="text-sm font-black uppercase text-amber-200">{action.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{action.text}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black uppercase italic">ჩემი განცხადებები</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-black text-white/50">{myAnnouncements.length}</span>
              </div>

              {myAnnouncements.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {myAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                      <AnnouncementCard announcement={announcement} />
                      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3">
                        <span className="truncate text-[10px] font-black uppercase tracking-wide text-white/45">
                          {getStatusLabel(announcement)}
                        </span>
                        <Link
                          href={`/announcements/${announcement.id}`}
                          className="shrink-0 rounded-xl border border-amber-300/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-amber-200 transition hover:bg-amber-400/10"
                        >
                          ნახვა / რედაქტირება
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                  თქვენს ანგარიშზე განცხადება ჯერ არ არის დამატებული.
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black uppercase italic">ჩემი სერვისები</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-black text-white/50">{myServices.length}</span>
              </div>

              {myServices.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myServices.map((service) => (
                    <Link
                      key={service.id}
                      href={`/community/masters/${service.id}`}
                      className="rounded-2xl border border-white/10 bg-[#0b0b15]/80 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-white">{service.full_name}</h3>
                          <p className="mt-1 line-clamp-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-300">
                            {service.profession}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase text-white/45">
                          {getMasterStatusLabel(service)}
                        </span>
                      </div>
                      {service.category ? <p className="mt-3 line-clamp-1 text-xs text-white/45">{service.category}</p> : null}
                      {service.location ? <p className="mt-1 text-xs text-white/45">{service.location}</p> : null}
                      {service.phone ? <p className="mt-3 text-xs font-bold text-white/65">ტელ: {service.phone}</p> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                  თქვენს ანგარიშზე სერვისული განცხადება ჯერ არ არის დამატებული.
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black uppercase italic">ფავორიტები</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-black text-white/50">{favoriteAnnouncements.length}</span>
              </div>

              {favoriteAnnouncements.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {favoriteAnnouncements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                  ფავორიტებში დამატებული განცხადებები აქ გამოჩნდება.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
