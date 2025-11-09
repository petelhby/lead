"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

/** Красим SVG из /public через CSS-маску */
function SvgMask({
  src,
  size = 32,
  color = "#0160C9",
  className = "",
}: { src: string; size?: number; color?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api("/api/projects", { auth: true })
      .then(setProjects)
      .catch((e) => setError(e.message));

    api("/api/tasks/all", { auth: true })
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);

  const counts = useMemo(() => {
    const by = (name: string) => tasks.filter((t) => String(t.status) === name).length;
    return {
      needReview: by("Выполнен, требует проверки"),
      inProgress: by("Принят к исполнению"),
    };
  }, [tasks]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* --- ВЕРХНИЙ БЛОК --- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-[#0160C9]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0160C9]/10">
              <SvgMask src="/stopwatch.svg" size={20} color="#0160C9" />
            </span>
            Панель управления
          </h1>
          <p className="text-slate-600 mt-1">
            Добро пожаловать, admin! Много Вам хороших проектов!
          </p>
        </div>

        <button
          onClick={() => {
            alert("Здесь будет форма создания проекта");
          }}
          className="h-9 px-4 rounded-lg text-sm font-medium border text-[#ffffff] border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition inline-flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span> Добавить проект
        </button>
      </div>

      {/* Статистика (две карточки) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Выполнен, требуют проверки */}
        <div className="relative rounded-xl bg-white shadow-md">
          <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
          <div className="p-4 flex items-start gap-3">
            <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
              <SvgMask src="/task_confirm.svg" size={18} color="#16A34A" />{/* зелёный */}
            </span>
            <div>
              <div className="text-xl font-semibold leading-none">
                {counts.needReview ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Заявок “Выполнен, требуют проверки”
              </div>
            </div>
          </div>
        </div>

        {/* Принят к исполнению */}
        <div className="relative rounded-xl bg-white shadow-md">
          <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
          <div className="p-4 flex items-start gap-3">
            <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
              <SvgMask src="/task_in_progress.svg" size={18} color="#D97706" />{/* оранжевый */}
            </span>
            <div>
              <div className="text-xl font-semibold leading-none">
                {counts.inProgress ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Заявок в “принят к исполнению”
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- СПИСОК ПРОЕКТОВ --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0160C9]">Проекты</h2>
        <input
          className="border rounded px-3 py-1 focus:outline-none focus:border-[#0160C9]"
          placeholder="Поиск"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <Link
            href={`/projects/${p.id}`}
            key={p.id}
            className="border bg-white rounded-lg p-3 hover:shadow transition"
          >
            <div className="font-medium mb-1 line-clamp-1">{p.name}</div>
            <StatusBadge status={p.status} />
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-600">Проектов пока нет.</div>
        )}
      </div>
    </div>
  );
}
