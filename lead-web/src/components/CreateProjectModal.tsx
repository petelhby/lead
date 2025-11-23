"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type ProjectStatus = "IN_PROGRESS" | "PAUSED" | "CLOSED" | "PAID";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "PAUSED", label: "Пауза" },
    { value: "CLOSED", label: "Закрыт" },
    { value: "PAID", label: "Оплачен" },
];

export default function CreateProjectModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (created: any) => void;
}) {
    const [name, setName] = useState("");
    const [deadline, setDeadline] = useState<string>("");
    const [status, setStatus] = useState<ProjectStatus>("IN_PROGRESS");

    const [address, setAddress] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [budget, setBudget] = useState<string>("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function submit() {
        try {
            if (!name.trim()) {
                setErr("Введите название проекта");
                return;
            }
            if (!deadline) {
                setErr("Укажите дату окончания проекта");
                return;
            }
            setBusy(true);
            setErr(null);

            const body: any = {
                name: name.trim(),
                description: description.trim() || null,
                budget: budget.trim() ? Number(replaceComma(budget)) : null,
                deadline: new Date(deadline).toISOString(),
                status,
                address: address.trim() || null,
                contactPerson: contactPerson.trim() || null,
                phone: phone.trim() || null,
                contactEmail: contactEmail.trim() || null, // ✅ сохраняем
                notes: notes.trim() || null,               // ✅ сохраняем
            };

            const created = await api("/api/projects", {
                auth: true,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            onCreated(created);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Не удалось создать проект");
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
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                    {/* header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50/60 rounded-t-2xl">
                        <h3 className="text-lg font-semibold text-[#0160C9]">Новый проект</h3>
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
                                placeholder="Например: Ремонт офиса на Ленина"
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
                                placeholder="Город, улица, дом…"
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
                                    placeholder="ФИО"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Телефон</span>
                                <input
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+7 (___) ___-__-__"
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
                                placeholder="Коротко, что делаем по проекту…"
                            />
                        </label>

                        {/* Заметки */}
                        <label className="block text-sm">
                            <span className="text-slate-600">Заметки</span>
                            <textarea
                                className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:border-[#0160C9]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Любые доп. пометки, чек-листы и т.п."
                            />
                        </label>

                        {err && <div className="text-sm text-red-600">{err}</div>}
                    </div>

                    {/* footer: слева — Сохранить, справа — Закрыть */}
                    <div className="flex items-center justify-between px-5 py-4 border-t">
                        <button
                            className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/90 active:scale-[0.99] transition disabled:opacity-60"
                            onClick={submit}
                            disabled={busy}
                        >
                            {busy ? "Создаём…" : "Сохранить"}
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

function replaceComma(s: string) {
    return s.replace(",", ".").replace(/\s+/g, "");
}
