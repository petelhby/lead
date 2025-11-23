"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = { id: number; name?: string };

type TaskLike = {
    id: number;
    title: string;
    description?: string | null;
    status?: string;
    dueDate?: string | null;   // может приходить как deadline/dueDate — нормализуем снаружи при передаче
    deadline?: string | null;
    assignedToId?: number | null;
    projectId: number;
};

const STATUSES = [
    "Новая",
    "Принят к исполнению",
    "Выполнен, требует проверки",
    "Закрыта",
];

export default function EditTaskModal({
    task,
    onClose,
    onUpdated,
    onDeleted,
}: {
    task: TaskLike;
    onClose: () => void;
    onUpdated: (updated: any) => void;
    onDeleted: (taskId: number) => void;
}) {
    // инициализируем поля из task
    const [title, setTitle] = useState(task.title || "");
    const [description, setDescription] = useState(task.description || "");
    const [assignedToId, setAssignedToId] = useState<number | "">(
        task.assignedToId ?? ""
    );
    const [status, setStatus] = useState<string>(String(task.status || "Новая"));

    // нормализуем дату дедлайна в значение для <input type="datetime-local">
    const initialIso = (task as any).dueDate || (task as any).deadline || null;
    const [dueDate, setDueDate] = useState<string>(
        initialIso ? toInputDateTimeValue(initialIso) : ""
    );

    const [users, setUsers] = useState<User[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setErr(null);
                // твой эндпоинт: /api/users/workers
                const list = await api("/api/users/workers", { auth: true });
                if (!cancelled) setUsers(Array.isArray(list) ? list : []);
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Не удалось загрузить исполнителей");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function submit() {
        try {
            if (!title.trim()) {
                setErr("Введите название задачи");
                return;
            }
            setBusy(true);
            setErr(null);

            const body: any = {
                title: title.trim(),
                description: description.trim(),
                status,
                projectId: task.projectId,
            };
            if (assignedToId !== "") body.assignedToId = Number(assignedToId);
            if (dueDate) body.dueDate = new Date(dueDate).toISOString();

            const updated = await api(`/api/tasks/${task.id}`, {
                auth: true,
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            onUpdated(updated);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось сохранить изменения");
        } finally {
            setBusy(false);
        }
    }

    async function removeTask() {
        if (!confirm("Удалить задачу? Действие необратимо.")) return;
        try {
            setBusy(true);
            setErr(null);
            await api(`/api/tasks/${task.id}`, {
                auth: true,
                method: "DELETE",
            });
            onDeleted(task.id);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось удалить задачу");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100]">
            {/* фон */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !busy && onClose()}
            />
            {/* модал */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50/60 rounded-t-2xl">
                        <h3 className="text-lg font-semibold text-[#0160C9]">
                            Настройки задачи
                        </h3>
                        <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                            onClick={() => !busy && onClose()}
                            title="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Название</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Описание</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 min-h-[90px] focus:outline-none focus:border-[#0160C9]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Исполнитель</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#0160C9]"
                                    value={assignedToId}
                                    onChange={(e) =>
                                        setAssignedToId(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                >
                                    <option value="">Не назначать</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || `Пользователь #${u.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Статус</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#0160C9]"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-600 mb-1">Дата сдачи</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {err && <div className="text-sm text-red-600">{err}</div>}
                    </div>

                    {/* Footer: слева — Сохранить, справа — Закрыть и (самая правая) Удалить */}
                    <div className="flex items-center justify-between px-5 py-4 border-t">
                        {/* слева */}
                        <button
                            className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/90 active:scale-[0.99] transition disabled:opacity-60"
                            onClick={submit}
                            disabled={busy}
                        >
                            {busy ? "Сохраняем…" : "Сохранить"}
                        </button>

                        {/* справа */}
                        <div className="flex items-center gap-2">
                            <button
                                className="h-9 px-4 rounded-lg border hover:bg-slate-50"
                                onClick={() => !busy && onClose()}
                                disabled={busy}
                            >
                                Закрыть
                            </button>

                            <button
                                className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                onClick={removeTask}
                                disabled={busy}
                                title="Удалить задачу"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Преобразует ISO-строку в значение для <input type="datetime-local"> */
function toInputDateTimeValue(isoLike: string): string {
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return "";
    // YYYY-MM-DDThh:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
