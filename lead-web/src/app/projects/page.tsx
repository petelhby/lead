"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, Task } from "@/lib/types";
import ProjectStatusBadge from "@/components/ProjectStatusBadge";
import CreateProjectModal from "@/components/CreateProjectModal";
import EditProjectModal from "@/components/EditProjectModal";

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

type Me = { id: number; role?: string; name?: string };

/** Универсально достаём подпись из строки/числа/объекта */
function labelFromValue(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    return v.name || v.fullName || v.title || v.label || v.email || null;
  }
  return null;
}

/** Извлекаем исполнителей ТОЛЬКО из самой задачи (без доп. запросов) */
function extractAssigneesShallow(t: TaskAny): string[] {
  const out: string[] = [];
  const explicitKeys = ["assignedTo", "assigned_to", "assignedUser", "assigned_user"] as const;
  for (const k of explicitKeys) {
    if ((t as any)[k] != null) {
      const lbl = labelFromValue((t as any)[k]);
      if (lbl) out.push(lbl);
    }
  }
  const re = /(assignee|worker|executor|performer|contractor|responsib|owner|doer|maker|staff|users?)$/i;
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
  const uniq = new Map<string, string>();
  for (const s of out.map(String)) {
    const clean = s.trim();
    if (!clean) continue;
    if (/^id\s+/i.test(clean)) continue;
    const key = clean.toLowerCase();
    if (!uniq.has(key)) uniq.set(key, clean);
  }
  return Array.from(uniq.values());
}

/** Админская роль? */
function isAdminRole(role?: string) {
  if (!role) return false;
  const r = role.toString().trim().toUpperCase();
  return r === "ADMIN" || r === "ROLE_ADMIN" || r === "SUPERADMIN" || r === "SUPER_ADMIN";
}

/** fallback парсер JWT */
function parseJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const [, base64] = token.split(".");
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch { return null; }
}

export default function ProjectsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskAny[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const amAdmin = isAdminRole(me?.role);

  // me
  useEffect(() => {
    (async () => {
      try {
        try {
          const me1 = await api("/api/users/me", { auth: true });
          if (me1 && (me1.id ?? me1.userId ?? me1.sub)) {
            setMe({ id: Number(me1.id ?? me1.userId ?? me1.sub), role: me1.role ?? me1.userRole, name: me1.name });
            return;
          }
        } catch { }
        try {
          const me2 = await api("/api/me", { auth: true });
          if (me2 && (me2.id ?? me2.userId ?? me2.sub)) {
            setMe({ id: Number(me2.id ?? me2.userId ?? me2.sub), role: me2.role ?? me2.userRole, name: me2.name });
            return;
          }
        } catch { }
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const p = parseJwt<any>(token);
        if (p) setMe({ id: Number(p.id ?? p.userId ?? p.sub), role: p.role ?? p.userRole, name: p.name });
      } catch { }
    })();
  }, []);

  // проекты и задачи (по роли)
  useEffect(() => {
    if (!me) return;

    api("/api/projects", { auth: true })
      .then(setProjects)
      .catch((e) => setError(e.message));

    const fetchTasks = () => {
      const url = amAdmin ? "/api/tasks/all" : "/api/tasks/my";
      return api(url, { auth: true })
        .then(setTasks)
        .catch(() => setTasks([]));
    };

    fetchTasks();
    const id = setInterval(fetchTasks, 15000);
    return () => clearInterval(id);
  }, [me, amAdmin]);

  // счётчики
  const counts = useMemo(() => {
    const by = (name: string) => tasks.filter((t) => String(t.status) === name).length;
    return {
      newTasks: by("Новая"),
      inProgress: by("Принят к исполнению"),
      needReview: by("Выполнен, требует проверки"),
    };
  }, [tasks]);

  // исполнители по проектам
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

  // счётчик задач по проектам
  const tasksCountByProject = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of tasks) {
      const pid = Number((t as any).projectId);
      if (!pid) continue;
      map.set(pid, (map.get(pid) || 0) + 1);
    }
    return map;
  }, [tasks]);

  // проекты рабочего (по его задачам)
  const workerProjectIds = useMemo(() => {
    if (amAdmin || !me?.id) return null;
    const set = new Set<number>();
    for (const t of tasks) {
      const pid = Number((t as any).projectId);
      if (!pid) continue;

      const assignedId =
        (t as any).assignedToId ??
        (t as any).assigned_to_id ??
        (t as any).assigneeId ??
        (t as any).assignee_id ??
        (t as any).assignedTo?.id ??
        (t as any).assigned_to?.id ??
        (t as any).assignee?.id ??
        null;

      if (Number(assignedId) === Number(me.id)) {
        set.add(pid);
      }
    }
    return set;
  }, [amAdmin, me?.id, tasks]);

  // поиск + фильтр по роли
  const filtered = useMemo(() => {
    const byName = (p: Project) => p.name.toLowerCase().includes(q.toLowerCase());
    if (amAdmin) return projects.filter(byName);
    if (!workerProjectIds || workerProjectIds.size === 0) return [];
    return projects.filter((p) => byName(p) && workerProjectIds.has(Number(p.id)));
  }, [projects, q, amAdmin, workerProjectIds]);

  // формат даты
  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  // открыть модалку настроек (только админ)
  const openEdit = (p: Project) => {
    if (!amAdmin) return;
    setEditingProject(p);
    setShowEdit(true);
  };

  // коллбеки модалки
  const handleProjectUpdated = (updated: any) => {
    setProjects((prev) =>
      prev.map((p) => (String(p.id) === String(updated.id) ? { ...p, ...updated } : p))
    );
  };
  const handleProjectDeleted = (projectId: number) => {
    setProjects((prev) => prev.filter((p) => Number(p.id) !== Number(projectId)));
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-[#0160C9]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0160C9]/10">
              <SvgMask src="/stopwatch.svg" size={20} color="#0160C9" />
            </span>
            Панель управления
          </h1>
          <p className="text-slate-600 mt-1">
            «Лучший способ начать делать — перестать говорить и взяться за работу» — Уолт Дисней.
          </p>
        </div>

        {amAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 rounded-lg text-sm font-medium border text-white border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition inline-flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span> Добавить проект
          </button>
        )}
      </div>

      {/* статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="/task_new.svg" color="#0ea5e9" value={counts.newTasks} label="Новые задачи" />
        <StatCard icon="/task_in_progress.svg" color="#D97706" value={counts.inProgress} label="Принятые к исполнению" />
        <StatCard icon="/task_confirm.svg" color="#16A34A" value={counts.needReview} label="Выполнены, ждут проверки" />
      </div>

      {/* список проектов */}
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
                  Проект
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
              {/* теперь «Действия» всегда есть, но содержимое зависит от роли */}
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
                      className="font-medium text-slate-900 hover:underline hover:text-[#0160C9]">
                      {p.name}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {assignees.length === 0 && <span className="text-slate-400">—</span>}
                      {assignees.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-md bg-[#d5c8be] px-2 py-1 text-xs text-[#3b2f2a]"
                          title={name}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-semibold">
                      {taskCount}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{fmtDate(p.createdAt)}</td>

                  <td className="px-5 py-4">
                    <ProjectStatusBadge status={p.status as any} />
                  </td>

                  {/* действия: для всех — «Открыть», для админа дополнительно «Настройки» */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0160C9]/10 hover:bg-[#0160C9]/20"
                        title="Открыть">
                        <SvgMask src="/eye.svg" size={18} color="#0160C9" />
                      </Link>

                      {amAdmin && (
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200"
                          title="Настройки проекта"
                          onClick={() => openEdit(p)}>
                          <SvgMask src="/cog.svg" size={18} color="#B45309" />
                        </button>
                      )}
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

      {/* Модалка создания проекта (только админ) */}
      {amAdmin && showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setProjects((prev) => [created, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {/* Модалка редактирования проекта (только админ) */}
      {amAdmin && showEdit && editingProject && (
        <EditProjectModal
          project={editingProject as any}
          onClose={() => {
            setShowEdit(false);
            setEditingProject(null);
          }}
          onUpdated={(updated) => {
            handleProjectUpdated(updated);
          }}
          onDeleted={(deletedId) => {
            handleProjectDeleted(deletedId);
            setShowEdit(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, color, value, label }: { icon: string; color: string; value?: number; label: string }) {
  return (
    <div className="relative rounded-xl bg-white shadow-md">
      <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
      <div className="p-4 flex items-start gap-3">
        <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
          <SvgMask src={icon} size={18} color={color} />
        </span>
        <div>
          <div className="text-xl font-semibold leading-none">{value ?? 0}</div>
          <div className="text-sm text-slate-600 mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}
