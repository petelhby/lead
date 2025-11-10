"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

/** Маска для SVG-иконок из /public */
function SvgMask({
  src,
  size = 20,
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

/** Гибкий тип задачи */
type TaskAny = Task & { [k: string]: any };

/** Универсально достаём подпись из строки/числа/объекта */
function labelFromValue(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    return (
      v.name ||
      v.fullName ||
      v.title ||
      v.label ||
      v.email ||
      null
    );
  }
  return null;
}

/** Извлекаем исполнителей ТОЛЬКО из самой задачи (без доп. запросов) */
function extractAssigneesShallow(t: TaskAny): string[] {
  const out: string[] = [];

  // 1) ЯВНО: поля из мобильного клиента
  const explicitKeys = [
    "assignedTo",
    "assigned_to",
    "assignedUser",
    "assigned_user",
  ] as const;

  for (const k of explicitKeys) {
    if (t[k] != null) {
      const lbl = labelFromValue(t[k]);
      if (lbl) out.push(lbl);
    }
  }

  // 2) Общий регекс для прочих вариантов
  const re =
    /(assignee|worker|executor|performer|contractor|responsib|owner|doer|maker|staff|users?)$/i;

  for (const [key, value] of Object.entries(t)) {
    if (!re.test(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        const lbl = labelFromValue(item);
        if (lbl) out.push(lbl);
      }
    } else {
      const lbl = labelFromValue(value);
      if (lbl) out.push(lbl);
    }
  }

  // Уникализация + фильтр «ID …»
  const uniq = new Map<string, string>();
  for (const s of out.map(String)) {
    const clean = s.trim();
    if (!clean) continue;
    if (/^id\s+/i.test(clean)) continue; // не показываем ID
    const key = clean.toLowerCase();
    if (!uniq.has(key)) uniq.set(key, clean);
  }
  return Array.from(uniq.values());
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskAny[]>([]);
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

  /** Верхние счётчики */
  const counts = useMemo(() => {
    const by = (name: string) =>
      tasks.filter((t) => String(t.status) === name).length;
    return {
      needReview: by("Выполнен, требует проверки"),
      inProgress: by("Принят к исполнению"),
    };
  }, [tasks]);

  /** Исполнители по проектам (плоские данные) */
  const assigneesByProject = useMemo(() => {
    const tmp = new Map<number, Set<string>>();
    for (const t of tasks) {
      const pid = Number((t as any).projectId);
      if (!pid) continue;
      const names = extractAssigneesShallow(t);
      if (!names.length) continue;
      const set = tmp.get(pid) || new Set<string>();
      names.forEach((n) => set.add(n));
      tmp.set(pid, set);
    }

    const result = new Map<number, string[]>();
    for (const [pid, set] of tmp.entries()) {
      const list = Array.from(set);
      list.sort((a, b) => a.localeCompare(b, "ru"));
      result.set(pid, list);
    }
    return result;
  }, [tasks]);

  /** Количество задач по проектам */
  const tasksCountByProject = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of tasks) {
      const pid = Number((t as any).projectId);
      if (!pid) continue;
      map.set(pid, (map.get(pid) || 0) + 1);
    }
    return map;
  }, [tasks]);

  /** Поиск по имени проекта */
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );

  /** Формат даты */
  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

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
          onClick={() => alert("Здесь будет форма создания проекта")}
          className="h-9 px-4 rounded-lg text-sm font-medium border text-white border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition inline-flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span> Добавить проект
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative rounded-xl bg-white shadow-md">
          <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
          <div className="p-4 flex items-start gap-3">
            <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
              <SvgMask src="/task_confirm.svg" size={18} color="#16A34A" />
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

        <div className="relative rounded-xl bg-white shadow-md">
          <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
          <div className="p-4 flex items-start gap-3">
            <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
              <SvgMask src="/task_in_progress.svg" size={18} color="#D97706" />
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

      {/* --- СПИСОК ПРОЕКТОВ (ТАБЛИЦА) --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0160C9]">Проекты</h2>
        <input
          className="border rounded px-3 py-1 focus:outline-none focus:border-[#0160C9]"
          placeholder="Поиск"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_object.svg" color="#8E9AAF" />
                  Объект
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_users.svg" color="#8E9AAF" />
                  Исполнители
                </span>
              </th>
              <th className="text-center font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_tasks.svg" color="#8E9AAF" />
                  Задачи
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_calendar.svg" color="#8E9AAF" />
                  Старт проекта
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_flag.svg" color="#8E9AAF" />
                  Статус проекта
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_actions.svg" color="#8E9AAF" />
                  Действия
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-slate-100">
            {filtered.map((p) => {
              const projectId = Number(p.id);
              const assignees = assigneesByProject.get(projectId) || [];
              const taskCount = tasksCountByProject.get(projectId) ?? 0;

              return (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-slate-900 hover:underline hover:text-[#0160C9]"
                    >
                      {p.name}
                    </Link>
                  </td>

                  {/* Исполнители проекта (уникальные) */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {assignees.length === 0 && (
                        <span className="text-slate-400">—</span>
                      )}
                      {assignees.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-md bg-[#d5c8be] px-2 py-1 text-xs text-[#3b2f2a]"
                          title={name}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Колонка Задачи — фиолетовый кружок по центру */}
                  <td className="px-5 py-4 text-center">
                    <span className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-semibold">
                      {taskCount}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{fmtDate(p.createdAt)}</td>

                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0160C9]/10 hover:bg-[#0160C9]/20"
                        title="Открыть"
                      >
                        <SvgMask src="/eye.svg" size={18} color="#0160C9" />
                      </Link>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200"
                        title="Настройки"
                        onClick={() => alert(`Настройки проекта #${p.id}`)}
                      >
                        <SvgMask src="/cog.svg" size={18} color="#B45309" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-center text-slate-500" colSpan={6}>
                  Проектов пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
