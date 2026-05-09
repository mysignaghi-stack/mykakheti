"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

interface SubmissionAuthGateProps {
  redirectPath: string;
  children: (session: Session) => ReactNode;
  heading?: string;
}

const AUTH_LANDING_PATH = "/";

export default function SubmissionAuthGate({ children, heading }: SubmissionAuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authError, setAuthError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerData, setRegisterData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        return;
      }

      const { data: refreshed } = await supabase.auth.refreshSession();
      setSession(refreshed.session ?? null);
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const setAuthRedirectCookie = useCallback((target: string) => {
    try {
      document.cookie = `auth_redirect=${encodeURIComponent(target)}; path=/; max-age=600`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoadingSession(false);
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('focus', refreshSession);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      listener?.subscription.unsubscribe();
      window.removeEventListener('focus', refreshSession);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (session) return;
    let active = true;
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(async () => {
      if (!active) return;
      attempts += 1;
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setLoadingSession(false);
          clearInterval(interval);
          return;
        }

        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session) {
          setSession(refreshed.session);
          setLoadingSession(false);
          clearInterval(interval);
          return;
        }
      } catch {
        setSession(null);
      }

      if (attempts >= maxAttempts) {
        setLoadingSession(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [session]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    const onMessage = (payload: MessageEvent) => {
      if (!payload?.data || payload.data.type !== 'auth-complete') return;
      refreshSession();
    };

    try {
      channel = new BroadcastChannel('mykakheti-auth');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'auth-complete') {
          refreshSession();
        }
      };
    } catch {
      // BroadcastChannel may be unavailable in older browsers.
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
      if (channel) channel.close();
    };
  }, [refreshSession]);

  const handleOAuth = async (provider: "google") => {
    setAuthError("");
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${AUTH_LANDING_PATH}` },
    });
    if (error) setAuthError("Social ავტორიზაცია ვერ შესრულდა, სცადეთ თავიდან.");
  };

  const handleEmailActivation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterMessage("");

    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.phone || !registerData.password) {
      setRegisterError("გთხოვთ შეავსოთ ყველა ველი.");
      return;
    }

    setRegisterLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: registerData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${AUTH_LANDING_PATH}`,
        },
      });

      if (error) throw error;
      setRegisterMessage("აქტივაციის ბმული გაიგზავნა თქვენს მითითებულ ელფოსტაზე. გთხოვთ შეამოწმოთ საფოსტო ყუთი.");
      setRegisterData({ firstName: "", lastName: "", email: "", phone: "", password: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setRegisterError(`ვერ გაიგზავნა ბმული: ${message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleInlineLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("გთხოვთ შეავსოთ ელფოსტა და პაროლი.");
      return;
    }

    setLoginLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setLoginEmail("");
      setLoginPassword("");
      window.location.href = AUTH_LANDING_PATH;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setResetError("");
    setResetMessage("");

    if (!email) {
      setResetError("გთხოვთ შეიყვანოთ ელფოსტა პაროლის აღსადგენად.");
      return;
    }

    setResetLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset?redirect=${encodeURIComponent(AUTH_LANDING_PATH)}`,
      });
      if (error) throw error;
      setResetMessage("პაროლის აღდგენის ბმული გაიგზავნა ელფოსტაზე.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setResetError(message);
    } finally {
      setResetLoading(false);
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
            <form onSubmit={handleInlineLogin} className="space-y-2 pt-2">
                <input
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                  placeholder="ელფოსტა"
                  type="email"
                  value={loginEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                />
              <div className="relative">
                <input
                  className="w-full p-3 pr-16 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                  placeholder="პაროლი"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/60 hover:text-white transition"
                >
                  {showLoginPassword ? "დამალვა" : "ჩვენება"}
                </button>
              </div>
              <p className="text-[10px] text-white/60">პაროლი: მინ. 6 სიმბოლო</p>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-white/90 text-slate-900 font-black py-3 uppercase text-[11px] hover:bg-white transition disabled:opacity-60"
                >
                  {loginLoading ? "იტვირთება..." : "შესვლა"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetError("");
                    setResetMessage("");
                    setResetEmail("");
                  }}
                  className="w-full rounded-xl border border-white/20 text-white/80 font-black py-2 uppercase text-[10px] hover:text-white hover:border-white/40 transition"
                >
                  პაროლის აღდგენა
                </button>
                {loginError && <p className="text-red-300 text-xs font-semibold">{loginError}</p>}
                {resetError && <p className="text-red-300 text-xs font-semibold">{resetError}</p>}
                {resetMessage && <p className="text-emerald-300 text-xs font-semibold">{resetMessage}</p>}
              </form>
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
            <div className="relative">
              <input
                className="w-full p-3 pr-16 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                placeholder="პაროლი"
                type={showRegisterPassword ? "text" : "password"}
                value={registerData.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/60 hover:text-white transition"
              >
                {showRegisterPassword ? "დამალვა" : "ჩვენება"}
              </button>
            </div>
            <p className="text-[10px] text-white/60">პაროლი: მინ. 6 სიმბოლო</p>
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

        {showResetModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b15]/95 p-5 shadow-2xl">
              <div className="text-center mb-3">
                <h4 className="text-sm font-black uppercase tracking-wide text-white">პაროლის აღდგენა</h4>
                <p className="text-[11px] text-white/60">შეიყვანეთ ელფოსტა ბმულის მისაღებად</p>
              </div>
              <input
                className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                placeholder="ელფოსტა"
                type="email"
                value={resetEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
              />
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => handlePasswordReset(resetEmail)}
                  disabled={resetLoading}
                  className="w-full rounded-xl bg-amber-600 text-white font-black py-2.5 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
                >
                  {resetLoading ? "იგზავნება..." : "ბმულის გაგზავნა"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full rounded-xl border border-white/20 text-white/70 font-black py-2 uppercase text-[10px] hover:text-white hover:border-white/40 transition"
                >
                  დახურვა
                </button>
                {resetError && <p className="text-red-300 text-xs font-semibold">{resetError}</p>}
                {resetMessage && <p className="text-emerald-300 text-xs font-semibold">{resetMessage}</p>}
              </div>
            </div>
          </div>
        )}
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
