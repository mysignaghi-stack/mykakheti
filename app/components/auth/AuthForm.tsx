"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleEmailAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user) await upsertProfile(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await upsertProfile(data.user);
      }
      router.push("/add");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Social provider არ არის ჩართული Supabase Dashboard-ში.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase italic">
          {mode === "login" ? "შესვლა" : "რეგისტრაცია"}
        </h1>
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="text-xs font-bold uppercase text-amber-400 hover:text-amber-300"
        >
          {mode === "login" ? "რეგისტრაცია" : "შესვლა"}
        </button>
      </div>

      <button
        onClick={() => handleOAuth("google")}
        className="w-full bg-white text-slate-900 font-black uppercase italic py-3 rounded-2xl hover:bg-amber-100 transition"
      >
        Continue with Google
      </button>
      <button
        onClick={() => handleOAuth("facebook")}
        className="w-full bg-[#1877f2] text-white font-black uppercase italic py-3 rounded-2xl hover:bg-[#145fcc] transition"
      >
        Continue with Facebook
      </button>

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
        onClick={handleEmailAuth}
        disabled={loading}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black uppercase italic py-3 rounded-2xl transition disabled:opacity-50"
      >
        {loading ? "იტვირთება..." : mode === "login" ? "შესვლა" : "რეგისტრაცია"}
      </button>

      <div className="text-center text-[11px] text-white/40">
        <Link href="/" className="hover:text-amber-400">
          მთავარი
        </Link>
      </div>
    </div>
  );
}
