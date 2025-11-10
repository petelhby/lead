"use client";

import Link from "next/link";
import Image from "next/image";
import { getToken, setToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Topbar() {
  const r = useRouter();
  const pathname = usePathname();

  // На странице входа верхнее меню не показываем
  if (pathname === "/") return null;

  // Чтобы не было ошибок гидрации: определяем авторизацию только после монтирования
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setAuthed(!!getToken());
    } catch {
      setAuthed(false);
    }
  }, []);

  return (
    <div className="w-full h-12 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl h-full mx-auto px-4 flex items-center justify-between">
        {/* ЛОГО + бренд */}
        <div className="flex items-center gap-3">
          <Link href="/projects" className="flex items-center gap-2">
            {/* кладём файл в /public/logo.png */}
            <Image
              src="/logo.png"
              alt="LEAD mark"
              width={24}
              height={24}
              // фикс ворнинга Next/Image, если где-то переопределяется размер
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
              Объекты
            </Link>
            <Link href="#" className="hover:text-[#0160C9]">
              Подрядчики
            </Link>
          </nav>
        </div>

        {/* Правая зона */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700 hidden sm:inline">admin</span>

          {/* Синяя кнопка “Настройки” */}
          <button
            className="px-3 py-1 rounded-full text-white text-sm bg-[#0160C9] hover:bg-[#0352a8] active:scale-[0.98] transition"
            onClick={() => {
              // TODO: открой модал/страницу настроек
              // r.push('/settings');
            }}
          >
            Настройки
          </button>

          {/* Кнопка «Выйти»: показываем только после монтирования, 
              но держим плейсхолдер для совпадения DOM при SSR */}
          {mounted ? (
            authed ? (
              <button
                className="text-sm underline text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setToken(null);
                  setAuthed(false);
                  r.push("/");
                }}
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
