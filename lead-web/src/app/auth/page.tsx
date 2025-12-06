"use client";

import { useState } from "react";
import { api, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // localStorage (как и раньше)
      setToken(res.token);

      // Cookie для middleware (читает только факт наличия)
      // max-age ~ 7 дней, подправь при необходимости
      document.cookie = `token=${res.token}; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`;

      r.push("/projects");
    } catch (e: any) {
      setError(e.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5ca3fb] via-[#287eff] to-[#0095ff]">
        <div className="absolute -top-32 -left-40 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-28 left-36 w-16 h-16 rounded-full bg-white/12 blur-md" />
        <div className="absolute bottom-24 right-24 w-72 h-72 rounded-full bg-white/12 blur-2xl" />
        <div className="absolute inset-0 [clip-path:polygon(0%_0%,100%_0%,100%_100%,35%_100%)] bg-white/5" />
      </div>

      {/* карточка */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-900/20 p-8 text-white">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="LEAD-ENG mark"
              width={60}
              height={60}
              priority
              className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
            />
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-wide text-center">
            LEAD CRM
          </h1>
          <p className="text-center text-white/90 mt-2">
            Добро пожаловать в систему
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl bg-white/15 border border-white/30 px-4 py-3 placeholder-white/70 outline-none focus:bg-white/20 focus:border-white"
              placeholder="имя пользователя"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full rounded-xl bg-white/15 border border-white/30 px-4 py-3 placeholder-white/70 outline-none focus:bg-white/20 focus:border-white"
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <p className="text-rose-200 text-sm">{error}</p>}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-white text-indigo-900 font-semibold py-3 shadow-lg active:scale-[0.99] transition disabled:opacity-70"
            >
              {loading ? "Входим…" : "Войти в систему"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
