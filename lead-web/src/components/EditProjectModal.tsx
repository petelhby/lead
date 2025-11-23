"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type ProjectStatus = "IN_PROGRESS" | "PAUSED" | "CLOSED" | "PAID";
const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "PAUSED", label: "Пауза" },
    { value: "CLOSED", label: "Закрыт" },
    { value: "PAID", label: "Оплачен" },
];

type ProjectLike = {
    id: number;
    name: string;
    status: ProjectStatus;
    deadline?: string | null;
    createdAt?: string | null;

    address?: string | null;
    contactPerson?: string | null;
    phone?: string | null;
    contactEmail?: string | null; // ✅ сохраняем
    notes?: string | null;        // ✅ сохраняем

    budget?: number | null;
    description?: string | null;
};

export default function EditProjectModal({
    project,
    onClose,
    onUpdated,
    onDeleted,
}: {
    project: ProjectLike;
    onClose: () => void;
    onUpdated: (updated: any) => void;
    onDeleted: (projectId: number) => void;
}) {
    // ── локальное состояние ─────────────────────────────
    const [name, setName] = useState(project.name || "");
    const [status, setStatus] = useState<ProjectStatus>(project.status);
    const [deadline, setDeadline] = useState(
        project.deadline ? toInputDateTimeValue(project.deadline) : ""
    );

    const [address, setAddress] = useState(project.address ?? "");
    const [contactPerson, setContactPerson] = useState(project.contactPerson ?? "");
    const [phone, setPhone] = useState(project.phone ?? "");
    const [contactEmail, setContactEmail] = useState(project.contactEmail ?? ""); // ✅
    const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : "");
    const [description, setDescription] = useState(project.description ?? "");
    const [notes, setNotes] = useState(project.notes ?? ""); // ✅

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    // обновление при замене project из родителя
    useEffect(() => {
        setName(project.name || "");
        setStatus(project.status);
        setDeadline(project.deadline ? toInputDateTimeValue(project.deadline) : "");
        setAddress(project.address ?? "");
        setContactPerson(project.contactPerson ?? "");
        setPhone(project.phone ?? "");
        setContactEmail(project.contactEmail ?? "");
        setBudget(project.budget != null ? String(project.budget) : "");
        setDescription(project.description ?? "");
        setNotes(project.notes ?? "");
    }, [project]);

    const changed = useMemo(() => {
        const eq = (a: any, b: any) => String(a ?? "") === String(b ?? "");
        return !(
            eq(name, project.name) &&
            eq(status, project.status) &&
            eq(deadline, project.deadline ? toInputDateTimeValue(project.deadline) : "") &&
            eq(address, project.address) &&
            eq(contactPerson, project.contactPerson) &&
            eq(phone, project.phone) &&
            eq(contactEmail, project.contactEmail) &&
            eq(budget, project.budget != null ? String(project.budget) : "") &&
            eq(description, project.description) &&
            eq(notes, project.notes)
        );
    }, [name, status, deadline, address, contactPerson, phone, contactEmail, budget, description, notes, project]);

    async function submit() {
        try {
            if (!name.trim()) {
                setErr("Введите название проекта");
                return;
            }
            setBusy(true);
            setErr(null);
            setOk(null);

            const body: any = {
                name: name.trim(),
                status,
                // deadline можно не менять, если поле пустое — отправим null
                deadline: deadline ? new Date(deadline).toISOString() : null,

                address: address.trim() || null,
                contactPerson: contactPerson.trim() || null,
                phone: phone.trim() || null,
                contactEmail: contactEmail.trim() || null, // ✅
                budget: budget.trim() ? Number(replaceComma(budget)) : null,
                description: description.trim() || null,
                notes: notes.trim() || null,               // ✅
            };

            const updated = await api(`/api/projects/${project.id}`, {
                auth: true,
                method: "PUT", // ✅ используем PUT (на бэке есть router.put('/:id', ...))
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            setOk("Сохранено");
            onUpdated(updated);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось сохранить изменения");
        } finally {
            setBusy(false);
        }
    }

    async function removeProject() {
        if (!confirm("Удалить проект? Все связанные задачи будут удалены. Действие необратимо.")) {
            return;
        }
        try {
            setBusy(true);
            setErr(null);
            await api(`/api/projects/${project.id}`, { auth: true, method: "DELETE" });
            onDeleted(project.id);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось удалить проект");
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
                <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                    {/* header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50/60 rounded-t-2xl">
                        <h3 className="text-lg font-semibold text-[#0160C9]">
                            Настройки проекта — {project.name}
                        </h3>
                        <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                            onClick={() => !busy && onClose()}
                            title="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    {/* body */}
                    <div className="p-5 space-y-4">
                        {/* Название */}
                        <label className="block text-sm">
                            <span className="text-slate-600">Название проекта</span>
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </label>

                        {/* Статус + Дата окончания */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block text-sm">
                                <span className="text-slate-600">Статус проекта</span>
                                <select
                                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#0160C9]"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Дата окончания</span>
                                <input
                                    type="datetime-local"
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Адрес */}
                        <label className="block text-sm">
                            <span className="text-slate-600">Адрес объекта</span>
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </label>

                        {/* Контакты */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="block text-sm">
                                <span className="text-slate-600">Контактное лицо</span>
                                <input
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Телефон</span>
                                <input
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Email</span>
                                <input
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="name@example.com"
                                />
                            </label>
                        </div>

                        {/* Бюджет */}
                        <label className="block text-sm">
                            <span className="text-slate-600">Бюджет (₽)</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="Например: 1500000"
                            />
                        </label>

                        {/* Описание */}
                        <label className="block text-sm">
                            <span className="text-slate-600">Описание проекта</span>
                            <textarea
                                className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[90px] focus:outline-none focus:border-[#0160C9]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Коротко: что делаем по проекту…"
                            />
                        </label>

                        {/* Заметки */}
                        <label className="block text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Заметки</span>
                                <span className="text-[11px] text-slate-500">
                                    Можно хранить чек-листы и этапы.
                                </span>
                            </div>
                            <textarea
                                className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[120px] focus:outline-none focus:border-[#0160C9]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={"Например:\n- [ ] Согласовать смету\n- [ ] Подписать договор\n- [ ] Заказ материалов"}
                            />
                        </label>

                        {err && <div className="text-sm text-red-600">{err}</div>}
                        {ok && <div className="text-sm text-emerald-600">{ok}</div>}
                    </div>

                    {/* footer: слева — Сохранить; справа — Закрыть и (крайняя правая) Удалить */}
                    <div className="flex items-center justify-between px-5 py-4 border-t">
                        <button
                            className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/90 active:scale-[0.99] transition disabled:opacity-60"
                            onClick={submit}
                            disabled={busy || !changed}
                        >
                            {busy ? "Сохраняем…" : "Сохранить"}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                className="h-9 px-4 rounded-lg border hover:bg-slate-50"
                                onClick={() => !busy && onClose()}
                                disabled={busy}
                            >
                                Закрыть
                            </button>

                            <button
                                className="h-9 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 active:scale-[0.99] transition disabled:opacity-60"
                                onClick={removeProject}
                                disabled={busy}
                                title="Удалить проект полностью"
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

/** ISO -> значение для <input type="datetime-local"> */
function toInputDateTimeValue(isoLike: string): string {
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function replaceComma(s: string) {
    return s.replace(",", ".").replace(/\s+/g, "");
}
