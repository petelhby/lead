"use client";

import Link from "next/link";
import Image from "next/image";
import { getToken, setToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Me = {
  id?: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export default function Topbar() {
  const r = useRouter();
  const pathname = usePathname();

  // На странице входа верхнее меню не показываем
  if (pathname === "/") return null;

  // Пост-монтажный флаг (чтобы избежать несоответствий SSR/CSR)
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [me, setMe] = useState<{ id: number; name?: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  // Инициализируем состояние авторизации
  useEffect(() => {
    setMounted(true);
    try {
      const has = !!getToken();
      setAuthed(has);
      if (has) {
        // подтягиваем имя
        fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/api/users/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => setMe(data))
          .catch(() => { });
      }
    } catch { setAuthed(false); }
  }, []);

  // Подтягиваем профиль, когда есть токен
  useEffect(() => {
    if (!mounted || !authed) {
      setMe(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingMe(true);
        const profile = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${getToken()}` },
        }).then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        });

        if (!cancelled) setMe(profile);
      } catch {
        // Токен мог протухнуть — считаем, что не авторизованы
        if (!cancelled) {
          setMe(null);
          setAuthed(false);
        }
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, authed]);

  const displayName =
    (me?.name && String(me.name).trim()) ||
    (me?.fullName && String(me.fullName).trim()) ||
    (me?.email && String(me.email).trim()) ||
    (authed ? "Пользователь" : "");

  return (
    <div className="w-full h-12 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl h-full mx-auto px-4 flex items-center justify-between">
        {/* ЛОГО + бренд */}
        <div className="flex items-center gap-3">
          <Link href="/projects" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="LEAD mark"
              width={24}
              height={24}
              style={{ height: "auto", width: 24 }}
              priority
            />
            <span className="font-semibold tracking-wide text-[#0160C9]">
              LEAD CRM
            </span>
          </Link>

          {/* Навигация */}
          <nav className="ml-6 hidden sm:flex items-center gap-4 text-sm text-slate-700">
            <Link href="/projects" className="hover:text-[#0160C9]">
              Проекты
            </Link>
            {/* можно добавить другие пункты */}
          </nav>
        </div>

        {/* Правая зона */}
        <div className="flex items-center gap-3">
          {me?.name && (
            <span className="text-sm text-slate-700 hidden sm:inline">{me.name}</span>
          )}
          {mounted ? (
            authed ? (
              <button
                className="text-sm underline text-slate-600 hover:text-slate-900"
                onClick={() => { setToken(null); setAuthed(false); window.location.href = '/'; }}
              >
                Выйти
              </button>
            ) : (
              <span className="inline-block w-[48px] h-[20px]" aria-hidden />
            )
          ) : (
            <span className="inline-block w-[48px] h-[20px]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
