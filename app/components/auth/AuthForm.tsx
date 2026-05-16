"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";
const AUTH_LANDING_PATH = "/";

interface AuthFormProps {
  initialMode?: Mode;
  onClose?: () => void;
  compact?: boolean;
}

export default function AuthForm({ initialMode = "login", onClose, compact = false }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const router = useRouter();

  const upsertProfile = async (user: User) => {
    const displayName =
      name ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email;

    await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, email: user.email, name: displayName }),
    });
  };

  const handleEmailAuth = async (e?: FormEvent) => {
    try { e?.preventDefault(); } catch {}
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(AUTH_LANDING_PATH)}`,
          },
        });
        if (error) throw error;
        if (data.user) await upsertProfile(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await upsertProfile(data.user);
      }
      router.push(AUTH_LANDING_PATH);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${AUTH_LANDING_PATH}` },
    });
    if (error) {
      setError("Social provider არ არის ჩართული Supabase Dashboard-ში.");
    }
  };

  const handlePasswordReset = async (emailToReset: string) => {
    setResetError("");
    setResetMessage("");
    if (!emailToReset) {
      setResetError("გთხოვთ შეიყვანოთ ელ.ფოსტა პაროლის აღსადგენად.");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/auth/reset?redirect=${encodeURIComponent(AUTH_LANDING_PATH)}`,
      });
      if (error) throw error;
      setResetMessage("პაროლის აღდგენის ბმული გაიგზავნა ელფოსტაზე.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className={`w-full ${compact ? "max-w-sm" : "max-w-md"} mx-auto bg-white/5 border border-white/10 rounded-3xl ${compact ? "p-4 sm:p-5" : "p-6 sm:p-8"} space-y-6 backdrop-blur-xl text-white`}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase italic">
          {mode === "login" ? "შესვლა" : "რეგისტრაცია"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="text-xs font-bold uppercase text-amber-400 hover:text-amber-300"
          >
            {mode === "login" ? "რეგისტრაცია" : "შესვლა"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold uppercase text-white/60 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => handleOAuth("google")}
        className="w-full bg-white text-slate-900 font-black uppercase italic py-3 rounded-2xl hover:bg-amber-100 transition"
      >
        Continue with Google
      </button>
      {/* Facebook sign-in temporarily disabled */}

      <form onSubmit={handleEmailAuth} className="w-full space-y-3">
        <div className="text-center text-xs text-white/40">ან Email</div>

        {mode === "signup" && (
          <input
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-500 outline-none"
            placeholder="სახელი და გვარი"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-500 outline-none"
          placeholder="ელ.ფოსტა"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-500 outline-none"
          placeholder="პაროლი"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black uppercase italic py-3 rounded-2xl transition disabled:opacity-50"
        >
          {loading ? "იტვირთება..." : mode === "login" ? "შესვლა" : "რეგისტრაცია"}
        </button>

        {mode === "login" && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetError("");
                setResetMessage("");
                setResetEmail(email);
              }}
              disabled={resetLoading}
              className="w-full rounded-2xl border border-white/20 text-white/80 font-black uppercase italic py-2 text-[11px] hover:text-white hover:border-white/40 transition disabled:opacity-60"
            >
              პაროლის აღდგენა
            </button>
          </div>
        )}

      </form>
      {showResetModal && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b15]/95 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-center">
              <h4 className="text-sm font-black uppercase tracking-wide text-white">პაროლის აღდგენა</h4>
              <p className="text-[11px] text-white/60">შეიყვანეთ ელფოსტა ბმულის მისაღებად</p>
            </div>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-[12px] text-white outline-none placeholder:text-white/40 focus:border-amber-500"
              placeholder="ელფოსტა"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoFocus
            />
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => handlePasswordReset(resetEmail)}
                disabled={resetLoading}
                className="w-full rounded-xl bg-amber-600 py-2.5 text-[11px] font-black uppercase text-white transition hover:bg-amber-500 disabled:opacity-60"
              >
                {resetLoading ? "იგზავნება..." : "ბმულის გაგზავნა"}
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-full rounded-xl border border-white/20 py-2 text-[10px] font-black uppercase text-white/70 transition hover:border-white/40 hover:text-white"
              >
                დახურვა
              </button>
              {resetError && <p className="text-xs font-bold text-red-400">{resetError}</p>}
              {resetMessage && <p className="text-xs font-bold text-emerald-300">{resetMessage}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="text-center text-[11px] text-white/40">
        <Link href="/" className="hover:text-amber-400">
          მთავარი
        </Link>
      </div>
    </div>
  );
}
