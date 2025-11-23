"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = { id: number; name?: string };

export default function CreateTaskModal({
    projectId,
    onClose,
    onCreated,
}: {
    projectId: number;
    onClose: () => void;
    onCreated: (task: any) => void;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedToId, setAssignedToId] = useState<number | "">("");
    const [dueDate, setDueDate] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setErr(null);
                // Берём работников (под твой эндпоинт)
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

            const body = {
                title: title.trim(),
                description: description.trim(),
                projectId,
                assignedToId: assignedToId === "" ? undefined : Number(assignedToId),
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            };

            const created = await api("/api/tasks", {
                auth: true,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            onCreated(created);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось создать задачу");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100]">
            {/* фон */}
            <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
            {/* модал */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50/60 rounded-t-2xl">
                        <h3 className="text-lg font-semibold text-[#0160C9]">Новая задача</h3>
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
                                placeholder="Например, Установить двери на 2 этаже"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Описание</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 min-h-[90px] focus:outline-none focus:border-[#0160C9]"
                                placeholder="Короткое описание задачи…"
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
                                        setAssignedToId(e.target.value === "" ? "" : Number(e.target.value))
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

                    {/* Footer: Сохранить слева, Закрыть справа */}
                    <div className="flex items-center justify-between px-5 py-4 border-t">
                        <button
                            className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/90 active:scale-[0.99] transition disabled:opacity-60"
                            onClick={submit}
                            disabled={busy}
                        >
                            {busy ? "Сохраняем…" : "Сохранить задачу"}
                        </button>

                        <button
                            className="h-9 px-4 rounded-lg border hover:bg-slate-50"
                            onClick={() => !busy && onClose()}
                            disabled={busy}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
