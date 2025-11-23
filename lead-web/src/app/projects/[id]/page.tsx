"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project, Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";

/** SVG mask helper */
function SvgMask({
  src,
  size = 18,
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

/** гибкий тип задачи */
type TaskAny = Task & { [k: string]: any };
type Me = { id: number; role?: string; name?: string };
type Worker = { id: number; name?: string };

/** извлекаем имя исполнителя */
const assigneeLabel = (t: TaskAny): string | null => {
  const v =
    t.assignedTo ??
    t.assigned_to ??
    t.assignedUser ??
    t.assigned_user ??
    t.assignee ??
    null;

  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.name || v.fullName || v.title || null;
  return null;
};

const getDeadline = (t: TaskAny): string | null => {
  return t.deadline ?? t.dueDate ?? t.finishAt ?? null;
};

function isAdminRole(role?: string) {
  if (!role) return false;
  const r = role.toString().trim().toUpperCase();
  return r === "ADMIN" || r === "ROLE_ADMIN" || r === "SUPERADMIN" || r === "SUPER_ADMIN";
}

function parseJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const [, base64] = token.split(".");
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch { return null; }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const amAdmin = isAdminRole(me?.role);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskAny[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]); // для модалки создания задачи
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // модалка создания задачи
  const [showCreateTask, setShowCreateTask] = useState(false);

  // модалка редактирования задачи
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskAny | null>(null);

  // подгружаем текущего пользователя
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

  // грузим проект, задачи и (для админа) список исполнителей
  useEffect(() => {
    if (!id || !me) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // проект
        const projects = (await api("/api/projects", { auth: true })) as Project[];
        const p = projects.find((x) => String(x.id) === String(id)) || null;
        if (!cancelled) setProject(p);

        // задачи: ADMIN -> все по проекту; WORKER -> только свои в этом проекте
        if (amAdmin) {
          const t = (await api(`/api/tasks/all?projectId=${id}`, { auth: true })) as TaskAny[];
          if (!cancelled) setTasks(t);
        } else {
          const my = (await api(`/api/tasks/my`, { auth: true })) as TaskAny[];
          const onlyThisProject = my.filter((t) => Number((t as any).projectId) === Number(id));
          if (!cancelled) setTasks(onlyThisProject);
        }

        // исполнители (только админу)
        if (amAdmin) {
          const ws = await api("/api/users/workers", { auth: true }).catch(() => []);
          if (!cancelled) setWorkers(Array.isArray(ws) ? ws : []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, me, amAdmin]);

  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return tasks.filter((t) => {
      const inTitle = (t.title || "").toLowerCase().includes(qq);
      const inExec = (assigneeLabel(t) || "").toLowerCase().includes(qq);
      return inTitle || inExec;
    });
  }, [tasks, q]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  // открыть модалку редактирования задачи
  const openEditTask = (t: TaskAny) => {
    setEditingTask(t);
    setShowEditTask(true);
  };

  // после обновления задачи в модалке
  const handleTaskUpdated = (updated: any) => {
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(updated.id) ? { ...t, ...updated } : t))
    );
  };

  // после удаления задачи в модалке
  const handleTaskDeleted = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => Number(t.id) !== Number(taskId)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-slate-50"
            title="Назад к проектам"
          >
            <SvgMask src="/arrow-left.svg" color="#64748b" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0160C9]">
              {project?.name ?? "Проект"}
            </h1>
            <p className="text-slate-600 mt-1">
              Старт проекта: {fmtDate((project as any)?.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-1 focus:outline-none focus:border-[#0160C9]"
            placeholder="Поиск по задачам/исполнителю"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="h-9 px-3 rounded-lg text-sm font-medium border text-white border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition"
            onClick={() => setShowCreateTask(true)}
            disabled={!amAdmin}
            title={amAdmin ? "Создать задачу" : "Доступно только администратору"}
          >
            + Задача
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_tasks.svg" color="#8E9AAF" />
                  Задача
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_users.svg" color="#8E9AAF" />
                  Исполнитель
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_flag.svg" color="#8E9AAF" />
                  Статус
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_calendar.svg" color="#8E9AAF" />
                  Создано
                </span>
              </th>
              <th className="text-left font-medium px-5 py-3">
                <span className="inline-flex items-center gap-2">
                  <SvgMask src="/table_calendar.svg" color="#8E9AAF" />
                  Срок сдачи
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
            {loading && (
              <tr>
                <td className="px-5 py-10 text-center text-slate-500" colSpan={6}>
                  Загрузка…
                </td>
              </tr>
            )}

            {!loading && err && (
              <tr>
                <td className="px-5 py-10 text-center text-red-600" colSpan={6}>
                  {err}
                </td>
              </tr>
            )}

            {!loading && !err && filtered.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-center text-slate-500" colSpan={6}>
                  Задач пока нет.
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              filtered.map((t) => {
                const name = assigneeLabel(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/tasks/${t.id}`}
                        className="font-medium text-slate-900 hover:underline hover:text-[#0160C9]">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {name ? (
                        <span className="inline-flex items-center rounded-md bg-[#d5c8be] px-2 py-1 text-xs text-[#3b2f2a]">
                          {name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {fmtDate((t as any).createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {fmtDate(getDeadline(t))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tasks/${t.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0160C9]/10 hover:bg-[#0160C9]/20"
                          title="Открыть">
                          <SvgMask src="/eye.svg" size={18} color="#0160C9" />
                        </Link>

                        {/* Настройки — открываем модалку редактирования (только админ) */}
                        {amAdmin && (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200"
                            title="Настройки задачи"
                            onClick={() => openEditTask(t)}>
                            <SvgMask src="/cog.svg" size={18} color="#B45309" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Модалка создания задачи — только для админа */}
      {showCreateTask && amAdmin && (
        <CreateTaskModal
          projectId={Number(id)}
          workers={workers}
          onClose={() => setShowCreateTask(false)}
          onCreated={(created) => {
            if (Number((created as any).projectId) === Number(id)) {
              setTasks((prev) => [created, ...prev]);
            }
            setShowCreateTask(false);
          }}
        />
      )}

      {/* Модалка редактирования задачи — только для админа */}
      {showEditTask && amAdmin && editingTask && (
        <EditTaskModal
          task={editingTask as any}
          onClose={() => {
            setShowEditTask(false);
            setEditingTask(null);
          }}
          onUpdated={(updated) => {
            handleTaskUpdated(updated);
            setShowEditTask(false);
            setEditingTask(null);
          }}
          onDeleted={(taskId) => {
            handleTaskDeleted(taskId);
            setShowEditTask(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
