"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { PROJECT_STATUS_MAP, PROJECT_STATUS_KEYS, ProjectStatus } from "@/lib/projectStatus";

// ⬇️ МОДАЛКА СОЗДАНИЯ ПРОЕКТА
import CreateProjectModal from "@/components/CreateProjectModal";

function Section({ title, icon, children }: any) {
    return (
        <div className="rounded-2xl bg-white shadow">
            <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-[#4b11d1] to-[#6c38f2] text-white flex items-center gap-2">
                {icon}
                <span className="font-semibold">{title}</span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

/** Статусы ИМЕННО проекта */
const PROJECT_STATUS_OPTIONS = [
    "IN_PROGRESS",
    "PAUSED",
    "CLOSED",
    "PAID",
] as const;

type FormState = {
    name: string;
    address: string;
    budget: string;
    startDate: string; // -> createdAt
    dueDate: string;   // -> deadline
    contactPerson: string;
    phone: string;
    status: string; // Project['status']
    description: string;
};

export default function ProjectSettingsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [initial, setInitial] = useState<Project | null>(null);
    const [form, setForm] = useState<FormState>({
        name: "",
        address: "",
        budget: "",
        startDate: "",
        dueDate: "",
        contactPerson: "",
        phone: "",
        status: "",
        description: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    // ⬇️ состояние модалки создания проекта
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const projects = (await api("/api/projects", { auth: true })) as Project[];
                const p = projects.find((x) => String(x.id) === String(id)) || null;
                if (!p) throw new Error("Проект не найден");

                if (!cancelled) {
                    setInitial(p);
                    setForm({
                        name: p.name ?? "",
                        address: (p as any).address ?? "",
                        budget: (p as any).budget?.toString?.() ?? "",
                        startDate: (p as any).createdAt ? toDateInput((p as any).createdAt) : "",
                        dueDate: (p as any).deadline ? toDateInput((p as any).deadline) : "",
                        contactPerson: (p as any).contactPerson ?? "",
                        phone: (p as any).phone ?? "",
                        status: (p as any).status ?? "",
                        description: (p as any).description ?? "",
                    });
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Ошибка загрузки");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const changed = useMemo(() => {
        if (!initial) return false;
        const cmp = (a: any, b: any) => (a ?? "") === (b ?? "");
        return !(
            cmp(form.name, initial.name) &&
            cmp(form.address, (initial as any).address) &&
            cmp(form.budget, (initial as any).budget?.toString?.()) &&
            cmp(form.startDate, (initial as any).createdAt ? toDateInput((initial as any).createdAt) : "") &&
            cmp(form.dueDate, (initial as any).deadline ? toDateInput((initial as any).deadline) : "") &&
            cmp(form.contactPerson, (initial as any).contactPerson) &&
            cmp(form.phone, (initial as any).phone) &&
            cmp(form.status, (initial as any).status) &&
            cmp(form.description, (initial as any).description)
        );
    }, [form, initial]);

    const onChange = (k: keyof FormState, v: string) =>
        setForm((s) => ({ ...s, [k]: v }));

    const onSubmit = async () => {
        setErr(null);
        setOk(null);

        if (!form.name.trim()) return setErr("Введите название проекта");
        if (!form.status.trim()) return setErr("Укажите статус проекта");

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                address: form.address.trim() || null,
                budget: form.budget.trim() ? Number(replaceComma(form.budget)) : null,
                createdAt: form.startDate || null,
                deadline: form.dueDate || null,
                contactPerson: form.contactPerson.trim() || null,
                phone: form.phone.trim() || null,
                status: form.status as ProjectStatus,
                description: form.description.trim() || null,
            };

            await api(`/api/projects/${id}`, {
                method: "PUT",
                auth: true,
                body: JSON.stringify(payload),
            });

            setOk("Сохранено");
        } catch (e: any) {
            setErr(e?.message || "Не удалось сохранить");
        } finally {
            setSaving(false);
        }
    };

    // обработчик успешного создания нового проекта из модалки
    const handleProjectCreated = (created: any) => {
        try {
            if (created && created.id) {
                // переходим на свежесозданный проект (деталка/настройки — на ваш выбор)
                router.push(`/projects/${created.id}`);
            } else {
                setOk("Проект создан");
            }
        } finally {
            setShowCreate(false);
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Загрузка…</div>;
    if (err && !initial) return <div className="p-6 text-red-600">{err}</div>;

    return (
        <div className="space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0160C9]">
                        Настройки проекта —{" "}
                        <span className="text-slate-900 font-semibold">
                            {initial?.name ?? "Проект"}
                        </span>
                    </h1>
                    <div className="text-slate-600">ID: {id}</div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Кнопка открытия модалки создания проекта */}
                    <button
                        onClick={() => setShowCreate(true)}
                        className="h-9 px-4 rounded-lg border text-sm text-[#0160C9] bg-white hover:bg-slate-50"
                        title="Создать новый проект"
                    >
                        + Проект
                    </button>

                    <button
                        onClick={() => router.push(`/projects/${id}`)}
                        className="h-9 px-4 rounded-lg border text-sm text-slate-700 bg-white hover:bg-slate-50"
                    >
                        Назад к проекту
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!changed || saving}
                        className="h-9 px-4 rounded-lg text-sm font-medium border text-white border-[#0160C9] bg-[#0160C9] disabled:opacity-50 hover:bg-[#077cfd]/80 transition"
                    >
                        {saving ? "Сохранение…" : "Сохранить"}
                    </button>
                </div>
            </div>

            {/* уведомления */}
            {err && <div className="text-sm text-red-600">{err}</div>}
            {ok && <div className="text-sm text-emerald-600">{ok}</div>}

            {/* макет 2 колонки */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* левая (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <Section
                        title="Основная информация"
                        icon={<span className="inline-block h-4 w-4 bg-white/80 rounded-full" />}
                    >
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Название" required value={form.name} onChange={(v) => onChange("name", v)} />
                            <SelectField
                                label="Статус проекта"
                                required
                                value={form.status}
                                options={PROJECT_STATUS_KEYS.map((k) => ({
                                    value: k,
                                    label: PROJECT_STATUS_MAP[k],
                                }))}
                                onChange={(v) => onChange("status", v)}
                            />

                            <Field label="Адрес" value={form.address} onChange={(v) => onChange("address", v)} />
                            <Field label="Бюджет" placeholder="напр. 100000" value={form.budget} onChange={(v) => onChange("budget", v)} />
                            <Field label="Контактное лицо" value={form.contactPerson} onChange={(v) => onChange("contactPerson", v)} />
                            <Field label="Телефон" value={form.phone} onChange={(v) => onChange("phone", v)} />
                        </div>

                        <div className="mt-4">
                            <Textarea label="Описание" rows={5} value={form.description} onChange={(v) => onChange("description", v)} />
                        </div>
                    </Section>
                </div>

                {/* правая (1/3) */}
                <div className="space-y-6">
                    <Section
                        title="Параметры проекта"
                        icon={<span className="inline-block h-4 w-4 bg-white/80 rounded-full" />}
                    >
                        <div className="grid gap-4">
                            <DateField label="Срок начала" value={form.startDate} onChange={(v) => onChange("startDate", v)} />
                            <DateField label="Срок сдачи" value={form.dueDate} onChange={(v) => onChange("dueDate", v)} />
                        </div>
                    </Section>
                </div>
            </div>

            {/* Модалка создания проекта */}
            {showCreate && (
                <CreateProjectModal
                    onClose={() => setShowCreate(false)}
                    onCreated={handleProjectCreated}
                />
            )}
        </div>
    );
}

/* ---------- UI helpers ---------- */

function Field({
    label, value, onChange, placeholder, required,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; }) {
    return (
        <label className="block text-sm">
            <span className="text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <input
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}

function Textarea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number; }) {
    return (
        <label className="block text-sm">
            <span className="text-slate-600">{label}</span>
            <textarea
                rows={rows}
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9] resize-y"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: ({ value: string; label: string } | string)[]; // поддержка обоих форматов
    required?: boolean;
}) {
    const opts = options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o
    );
    return (
        <label className="block text-sm">
            <span className="text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <select
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9] bg-white"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>Выберите…</option>
                {opts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </label>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
    return (
        <label className="block text-sm">
            <span className="text-slate-600">{label}</span>
            <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

/* ---------- small utils ---------- */
function toDateInput(v: string) {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
}
function replaceComma(s: string) {
    return s.replace(",", ".").replace(/\s+/g, "");
}
