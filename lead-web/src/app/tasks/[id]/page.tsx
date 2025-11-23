"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Task, TaskEntry } from "@/lib/types";
import UploadPhotos from "@/components/UploadPhotos";
import StatusBadge from "@/components/StatusBadge";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001").replace(/\/$/, "");

/** Преобразуем значения photos к публичным URL */
const toPublicUrl = (u: string) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  const name = u.split(/[\\/]/).pop() || "";
  return name ? `${API_BASE}/uploads/${name}` : u;
};

/** Единый форматтер даты/времени — 24 часа */
const dtf = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const formatDateTime = (value?: string | Date) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : dtf.format(d);
};

type TaskAny = Task & { [k: string]: any };
type Me = { id: number; role?: string; name?: string };

/** Определяем, является ли роль админской — без учёта регистра и с синонимами */
const isAdminRole = (role?: string) => {
  if (!role) return false;
  const r = role.toString().trim().toLowerCase();
  return (
    r === "admin" ||
    r === "administrator" ||
    r === "админ" ||
    r === "role_admin" ||
    r === "superadmin" ||
    r === "super_admin"
  );
};

/** Парсим payload JWT (fallback, если /me не доступен) */
function parseJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const [, base64] = token.split(".");
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export default function TaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [me, setMe] = useState<Me | null>(null);
  const [task, setTask] = useState<TaskAny | null>(null);
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [report, setReport] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadMeRobust() {
    try {
      const me1 = await api("/api/users/me", { auth: true });
      if (me1 && (me1.id ?? me1.userId ?? me1.sub)) {
        setMe({
          id: Number(me1.id ?? me1.userId ?? me1.sub),
          role: me1.role ?? me1.userRole ?? me1.Role ?? me1.position,
          name: me1.name,
        });
        return;
      }
    } catch { }
    try {
      const me2 = await api("/api/me", { auth: true });
      if (me2 && (me2.id ?? me2.userId ?? me2.sub)) {
        setMe({
          id: Number(me2.id ?? me2.userId ?? me2.sub),
          role: me2.role ?? me2.userRole ?? me2.Role ?? me2.position,
          name: me2.name,
        });
        return;
      }
    } catch { }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const p = parseJwt<any>(token);
    if (p) {
      const id = Number(p.id ?? p.userId ?? p.sub);
      const role = p.role ?? p.userRole ?? p.Role ?? p.position;
      if (id) setMe({ id, role, name: p.name });
    }
  }

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // грузим пользователя и саму задачу/записи
      await loadMeRobust();

      const t: TaskAny = await api(`/api/tasks/${id}`, { auth: true });
      setTask(t || null);

      const es: TaskEntry[] = await api(`/api/tasks/${id}/entries`, { auth: true });
      setEntries(
        [...es].sort(
          (a, b) =>
            new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
        )
      );
    } catch (e: any) {
      // 403 — нет доступа (worker не назначен на задачу)
      if (typeof e?.message === "string" && /access denied|403/i.test(e.message)) {
        setErr("Нет доступа к этой задаче");
      } else {
        setErr(e?.message || "Ошибка загрузки");
      }
      setTask(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /** Добавить запись (комментарий + выбранные фото) */
  async function addEntry() {
    try {
      if (!report.trim() && selectedFiles.length === 0) return;

      setSubmitting(true);
      const form = new FormData();
      if (report.trim()) form.append("report", report.trim());
      selectedFiles.forEach((f) => form.append("photos", f)); // имя поля — photos

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/tasks/${id}/entries`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      setReport("");
      setSelectedFiles([]);
      await load();
    } catch (e: any) {
      setErr(e.message || "Не удалось добавить запись");
    } finally {
      setSubmitting(false);
    }
  }

  /** Удаление записи */
  async function deleteEntry(entryId: number) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/tasks/${id}/entries/${entryId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setErr(e.message || "Не удалось удалить запись");
    }
  }

  /** Смена статуса задачи */
  async function updateStatus(newStatus: string) {
    if (!task) return;
    try {
      setSavingStatus(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(
        `${(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001").replace(/\/$/, "")}/api/tasks/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      await load();
    } catch (e: any) {
      setErr(e.message || "Не удалось обновить статус");
    } finally {
      setSavingStatus(false);
    }
  }

  const createdAt = useMemo(() => formatDateTime(task?.createdAt), [task?.createdAt]);
  const dueAt = useMemo(() => {
    const v = (task as any)?.deadline || (task as any)?.dueDate;
    return formatDateTime(v);
  }, [task]);

  /** Описание задачи — берём из нескольких возможных полей */
  const taskDescription = useMemo(() => {
    const d =
      (task?.description as any) ??
      (task as any)?.desc ??
      (task as any)?.details ??
      (task as any)?.text ??
      "";
    return typeof d === "string" ? d.trim() : "";
  }, [task]);

  if (loading) return <div className="p-4">Загрузка…</div>;
  if (!task)
    return (
      <div className="p-4">
        <div className={`mb-3 ${err ? "text-red-600" : "text-slate-600"}`}>
          {err || "Задача не найдена."}
        </div>
        <button className="underline" onClick={() => router.back()}>
          Назад
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-slate-50"
            title="Назад"
          >
            <span className="sr-only">Назад</span>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#64748b" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          <div>
            <div className="text-sm text-slate-500">
              Проект:{" "}
              {task.projectId ? (
                <Link
                  href={`/projects/${task.projectId}`}
                  className="underline hover:text-[#0160C9]">
                  #{task.projectId}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0160C9]">
              {task.title}
            </h1>
            {/* описание перенесено в отдельный блок ниже */}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={String(task.status || "")}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={savingStatus}
            title="Изменить статус"
          >
            <option value="Новая">Новая</option>
            <option value="Принят к исполнению">Принят к исполнению</option>
            <option value="Выполнен, требует проверки">Выполнен, требует проверки</option>
            <option value="Закрыта">Закрыта</option>
          </select>
        </div>
      </div>

      {/* Мета */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white shadow p-4">
          <div className="text-sm text-slate-500">Создано</div>
          <div className="mt-1">{createdAt || "—"}</div>
        </div>
        <div className="rounded-xl bg-white shadow p-4">
          <div className="text-sm text-slate-500">Срок сдачи</div>
          <div className="mt-1">{dueAt || "—"}</div>
        </div>
        <div className="rounded-xl bg-white shadow p-4">
          <div className="text-sm text-slate-500">Исполнитель</div>
          <div className="mt-1">
            {(() => {
              const v =
                (task as any).assignedTo ??
                (task as any).assigned_to ??
                (task as any).assignee;
              if (!v) return "—";
              if (typeof v === "string") return v;
              if (typeof v === "object") return v.name || v.fullName || "—";
              return "—";
            })()}
          </div>
        </div>
      </div>

      {/* Описание задачи */}
      <div className="rounded-2xl bg-white shadow p-4">
        <div className="font-semibold mb-2">Описание</div>
        <div className={taskDescription ? "whitespace-pre-wrap text-slate-800" : "text-slate-500"}>
          {taskDescription || "—"}
        </div>
      </div>

      {/* Новый комментарий */}
      <div className="rounded-2xl bg-white shadow">
        <div className="px-4 py-3 border-b bg-slate-50/50 rounded-t-2xl">
          <div className="font-semibold">Новый комментарий</div>
        </div>
        <div className="p-4 space-y-4">
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[120px] focus:outline-none focus:border-[#0160C9]"
            placeholder="Напишите комментарий…"
            value={report}
            onChange={(e) => setReport(e.target.value)}
          />

          {/* Выбор/превью фото */}
          <UploadPhotos files={selectedFiles} onChange={setSelectedFiles} disabled={submitting} />

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={addEntry}
              className="px-4 h-10 rounded-lg bg-[#2f52e7] text-white hover:bg-[#2443c7] active:scale-[0.99] transition disabled:opacity-60"
              disabled={submitting || (!report.trim() && selectedFiles.length === 0)}
            >
              {submitting ? "Сохраняем…" : "Добавить"}
            </button>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </div>

      {/* Лента записей */}
      <div className="space-y-3">
        <div className="font-semibold">Комментарии</div>

        {entries.length === 0 && (
          <div className="text-sm text-slate-600">Пока нет комментариев.</div>
        )}

        {entries.map((e) => {
          const amAdmin = isAdminRole(me?.role);
          const isOwner = (e as any).author?.id === me?.id;
          const canDelete = !!me && (amAdmin || isOwner);

          return (
            <div key={e.id} className="relative border bg-white rounded-2xl p-4 space-y-3">
              {canDelete && (
                <button
                  className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                  onClick={() => deleteEntry(Number(e.id))}
                  title="Удалить комментарий"
                >
                  ✕
                </button>
              )}

              <div className="text-sm text-slate-600">
                {formatDateTime(e.createdAt)}
                {(e as any).author?.name ? ` · ${(e as any).author.name}` : ""}
              </div>

              {e.report && <div className="whitespace-pre-line">{e.report}</div>}

              {Array.isArray(e.photos) && e.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {e.photos.map((url, i) => {
                    const pub = toPublicUrl(url as any);
                    return (
                      <a key={i} href={pub} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={pub}
                          alt="photo"
                          className="w-full h-40 object-cover rounded-lg"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
