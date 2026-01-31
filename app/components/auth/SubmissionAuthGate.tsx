"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

interface SubmissionAuthGateProps {
  redirectPath: string;
  children: (session: Session) => ReactNode;
  heading?: string;
}

export default function SubmissionAuthGate({ redirectPath, children, heading }: SubmissionAuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authError, setAuthError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerData, setRegisterData] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoadingSession(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    loadSession();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleOAuth = async (provider: "google") => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPath}` },
    });
    if (error) setAuthError("Social ავტორიზაცია ვერ შესრულდა, სცადეთ თავიდან.");
  };

  const handleEmailActivation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterMessage("");

    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.phone) {
      setRegisterError("გთხოვთ შეავსოთ ყველა ველი.");
      return;
    }

    setRegisterLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: registerData.email,
        options: {
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: registerData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPath}`,
        },
      });

      if (error) throw error;
      setRegisterMessage("აქტივაციის ბმული გაიგზავნა თქვენს მითითებულ ელფოსტაზე. გთხოვთ შეამოწმოთ საფოსტო ყუთი.");
      setRegisterData({ firstName: "", lastName: "", email: "", phone: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setRegisterError(`ვერ გაიგზავნა ბმული: ${message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loadingSession) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm">
        იტვირთება ავტორიზაცია...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-50">
        <div className="space-y-1 text-center">
          {heading ? (
            <h2 className="text-base font-black uppercase tracking-widest text-amber-400">{heading}</h2>
          ) : null}
          <p className="font-black uppercase tracking-wide text-[11px]">საწყის ეტაპზე საჭიროა ავტორიზაცია ან რეგისტრაცია.</p>
          <p className="text-[11px] text-white/70">რეგისტრაციის დასრულების შემდეგ გამოჩნდება გაგზავნის ფორმა.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი სოც. ავტორიზაცია</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="rounded-xl bg-white text-slate-900 font-black py-3 uppercase text-[11px] hover:bg-amber-50 transition"
              >
                Google ავტორიზაცია
              </button>
              {/* Facebook ავტორიზაცია დროებით შეჩერებულია */}
            </div>
            {authError && <p className="text-red-300 text-xs font-semibold">{authError}</p>}
          </div>

          <form onSubmit={handleEmailActivation} className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი რეგისტრაცია (Email ლინკი)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                placeholder="სახელი"
                value={registerData.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, firstName: e.target.value })}
              />
              <input
                className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                placeholder="გვარი"
                value={registerData.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, lastName: e.target.value })}
              />
            </div>
            <input
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
              placeholder="ელფოსტა"
              type="email"
              value={registerData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, email: e.target.value })}
            />
            <input
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
              placeholder="ტელეფონი"
              value={registerData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, phone: e.target.value })}
            />
            <button
              type="submit"
              disabled={registerLoading}
              className="w-full rounded-xl bg-amber-600 text-white font-black py-3 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
            >
              {registerLoading ? "იგზავნება..." : "მიიღე აქტივაციის ბმული"}
            </button>
            {registerError && <p className="text-red-300 text-xs font-semibold">{registerError}</p>}
            {registerMessage && <p className="text-emerald-300 text-xs font-semibold">{registerMessage}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 text-sm">
        <div>
          <p className="text-white font-black uppercase text-[11px]">გააქტიურებულია გამარტივებული ავტორიზაცია</p>
          <p className="text-white/60 text-xs">{session.user.email || session.user.phone || "დადასტურებული მომხმარებელი"}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-[11px] font-black uppercase italic text-white/70 hover:text-white transition-all bg-white/5 border border-white/10 rounded-full px-3 py-1"
        >
          გამოსვლა
        </button>
      </div>
      {children(session)}
    </div>
  );
}
