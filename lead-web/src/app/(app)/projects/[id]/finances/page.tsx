"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Me = { id: number; role?: string; name?: string };
type Contract = {
    id: number;
    projectId: number;
    title: string;
    date: string;
    amount: string | number;
};
type Payment = {
    id: number;
    projectId: number;
    contractId?: number | null;
    kind: string;
    date: string;
    amount: string | number;
};

function isAdminRole(role?: string) {
    if (!role) return false;
    const r = role.toString().trim().toUpperCase();
    return r === "ADMIN" || r === "ROLE_ADMIN" || r === "SUPERADMIN" || r === "SUPER_ADMIN";
}

const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
};

export default function ProjectFinancePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [totals, setTotals] = useState<{ totalContracts: number; totalPayments: number; debt: number } | null>(null);

    // формы
    const [cTitle, setCTitle] = useState("");
    const [cDate, setCDate] = useState<string>("");
    const [cAmount, setCAmount] = useState<string>("");

    const [pKind, setPKind] = useState("Авансовый платеж");
    const [pContractId, setPContractId] = useState<string>("");
    const [pDate, setPDate] = useState<string>("");
    const [pAmount, setPAmount] = useState<string>("");

    const amAdmin = isAdminRole(me?.role);

    async function loadMe() {
        try {
            const m = await api("/api/users/me", { auth: true });
            setMe({ id: Number(m.id), role: m.role, name: m.name });
        } catch {
            setMe(null);
        }
    }

    async function loadFinance() {
        const data = await api(`/api/projects/${id}/finance`, { auth: true });
        setContracts(data.contracts || []);
        setPayments(data.payments || []);
        setTotals(data.totals || null);
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                await loadMe();
                await loadFinance();
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Ошибка загрузки");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    async function addContract() {
        try {
            if (!amAdmin) return;
            if (!cTitle.trim() || !cDate || !cAmount) return;
            await api(`/api/projects/${id}/finance/contracts`, {
                auth: true,
                method: "POST",
                body: JSON.stringify({
                    title: cTitle.trim(),
                    date: cDate,
                    amount: cAmount.replace(",", "."),
                }),
            });
            setCTitle(""); setCDate(""); setCAmount("");
            await loadFinance();
        } catch (e: any) {
            alert(e?.message || "Не удалось создать договор");
        }
    }

    async function deleteContract(contractId: number) {
        if (!amAdmin) return;
        if (!confirm("Удалить договор? Платежи, привязанные к нему, не должны существовать.")) return;
        try {
            await api(`/api/projects/${id}/finance/contracts/${contractId}`, {
                auth: true,
                method: "DELETE",
            });
            await loadFinance();
        } catch (e: any) {
            alert(e?.message || "Не удалось удалить договор");
        }
    }

    async function addPayment() {
        try {
            if (!amAdmin) return;
            if (!pKind.trim() || !pDate || !pAmount) return;
            await api(`/api/projects/${id}/finance/payments`, {
                auth: true,
                method: "POST",
                body: JSON.stringify({
                    kind: pKind.trim(),
                    contractId: pContractId ? Number(pContractId) : null,
                    date: pDate,
                    amount: pAmount.replace(",", "."),
                }),
            });
            setPKind("Авансовый платеж"); setPContractId(""); setPDate(""); setPAmount("");
            await loadFinance();
        } catch (e: any) {
            alert(e?.message || "Не удалось добавить платеж");
        }
    }

    async function deletePayment(paymentId: number) {
        if (!amAdmin) return;
        if (!confirm("Удалить платеж?")) return;
        try {
            await api(`/api/projects/${id}/finance/payments/${paymentId}`, {
                auth: true,
                method: "DELETE",
            });
            await loadFinance();
        } catch (e: any) {
            alert(e?.message || "Не удалось удалить платеж");
        }
    }

    if (loading) return <div className="p-4">Загрузка…</div>;
    if (err) return (
        <div className="p-4">
            <div className="mb-2 text-red-600">{err}</div>
            <button className="underline" onClick={() => router.push(`/projects/${id}`)}>Назад к проекту</button>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/projects/${id}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-slate-50"
                        title="Назад к проекту"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#64748b" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0160C9]">Финансы проекта</h1>
                        <p className="text-slate-600 mt-1">Управление договорами и платежами (только для администратора).</p>
                    </div>
                </div>
            </div>

            {/* ИТОГИ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative rounded-xl bg-white shadow-md p-4">
                    <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
                    <div className="text-sm text-slate-600">Сумма по договорам</div>
                    <div className="text-2xl font-semibold mt-1">{(totals?.totalContracts ?? 0).toLocaleString("ru-RU")} ₽</div>
                </div>
                <div className="relative rounded-xl bg-white shadow-md p-4">
                    <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
                    <div className="text-sm text-slate-600">Оплачено</div>
                    <div className="text-2xl font-semibold mt-1">{(totals?.totalPayments ?? 0).toLocaleString("ru-RU")} ₽</div>
                </div>
                <div className="relative rounded-xl bg-white shadow-md p-4">
                    <div className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-xl bg-[#0160C9]" />
                    <div className="text-sm text-slate-600">Долг заказчика</div>
                    <div className="text-2xl font-semibold mt-1">
                        {((totals?.debt ?? 0) as number).toLocaleString("ru-RU")} ₽
                    </div>
                </div>
            </div>

            {/* ФОРМЫ — как было: два блока в ряд */}
            {amAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Добавить договор/ДС */}
                    <div className="rounded-2xl bg-white shadow">
                        <div className="px-5 py-3 rounded-t-2xl bg-[linear-gradient(135deg,#5ca3fb_0%,#287eff_45%,#0095ff_100%)] text-white font-semibold">
                            Добавить договор / доп. соглашение
                        </div>
                        <div className="p-5 space-y-3">
                            <label className="block text-sm">
                                <span className="text-slate-600">Название</span>
                                <input
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={cTitle}
                                    onChange={(e) => setCTitle(e.target.value)}
                                    placeholder="Договор №1 / ДС №1"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Дата</span>
                                <input
                                    type="date"
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={cDate}
                                    onChange={(e) => setCDate(e.target.value)}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Сумма, ₽</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={cAmount}
                                    onChange={(e) => setCAmount(e.target.value)}
                                    placeholder="Напр. 500000"
                                />
                            </label>

                            <div className="pt-2">
                                <button
                                    onClick={addContract}
                                    className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition"
                                >
                                    Сохранить договор
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Добавить платеж */}
                    <div className="rounded-2xl bg-white shadow">
                        <div className="px-5 py-3 rounded-t-2xl bg-[linear-gradient(135deg,#5ca3fb_0%,#287eff_45%,#0095ff_100%)] text-white font-semibold">
                            Добавить платеж
                        </div>
                        <div className="p-5 space-y-3">
                            <label className="block text-sm">
                                <span className="text-slate-600">Основание платежа</span>
                                <input
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={pKind}
                                    onChange={(e) => setPKind(e.target.value)}
                                    placeholder="Авансовый платеж"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">К договору</span>
                                <select
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9] bg-white"
                                    value={pContractId}
                                    onChange={(e) => setPContractId(e.target.value)}
                                >
                                    <option value="">— Не выбрано —</option>
                                    {contracts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} · {fmtDate(c.date)} · {(Number(c.amount) || 0).toLocaleString("ru-RU")} ₽
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Дата платежа</span>
                                <input
                                    type="date"
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={pDate}
                                    onChange={(e) => setPDate(e.target.value)}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Сумма, ₽</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#0160C9]"
                                    value={pAmount}
                                    onChange={(e) => setPAmount(e.target.value)}
                                    placeholder="Напр. 200000"
                                />
                            </label>

                            <div className="pt-2">
                                <button
                                    onClick={addPayment}
                                    className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition"
                                >
                                    Сохранить платеж
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* НИЖНИЕ БЛОКИ — на всю ширину, один за другим */}

            {/* Список договоров */}
            <section className="overflow-hidden rounded-2xl bg-white shadow">
                <div className="px-5 py-4 rounded-t-2xl text-white font-semibold bg-[linear-gradient(135deg,#5ca3fb_0%,#287eff_45%,#0095ff_100%)]">
                    Список договоров
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500">
                                <th className="text-left font-medium px-5 py-3">Название</th>
                                <th className="text-left font-medium px-5 py-3">Дата</th>
                                <th className="text-right font-medium px-5 py-3">Сумма</th>
                                <th className="text-right font-medium px-5 py-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-slate-100">
                            {contracts.length === 0 && (
                                <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={4}>Нет договоров</td></tr>
                            )}
                            {contracts.map(c => (
                                <tr key={c.id}>
                                    <td className="px-5 py-3">{c.title}</td>
                                    <td className="px-5 py-3">{fmtDate(c.date)}</td>
                                    <td className="px-5 py-3 text-right">{(Number(c.amount) || 0).toLocaleString("ru-RU")} ₽</td>
                                    <td className="px-5 py-3 text-right">
                                        {amAdmin ? (
                                            <button
                                                className="inline-flex h-8 px-3 items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-700"
                                                onClick={() => deleteContract(c.id)}
                                            >
                                                Удалить
                                            </button>
                                        ) : <span className="text-slate-400">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Список платежей */}
            <section className="overflow-hidden rounded-2xl bg-white shadow">
                <div className="px-5 py-4 rounded-t-2xl text-white font-semibold bg-[linear-gradient(135deg,#5ca3fb_0%,#287eff_45%,#0095ff_100%)]">
                    Список платежей
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500">
                                <th className="text-left font-medium px-5 py-3">Основание</th>
                                <th className="text-left font-medium px-5 py-3">К договору</th>
                                <th className="text-left font-medium px-5 py-3">Дата</th>
                                <th className="text-right font-medium px-5 py-3">Сумма</th>
                                <th className="text-right font-medium px-5 py-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-slate-100">
                            {payments.length === 0 && (
                                <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={5}>Нет платежей</td></tr>
                            )}
                            {payments.map(p => {
                                const c = p.contractId ? contracts.find(x => x.id === p.contractId) : null;
                                return (
                                    <tr key={p.id}>
                                        <td className="px-5 py-3">{p.kind}</td>
                                        <td className="px-5 py-3">{c ? c.title : "—"}</td>
                                        <td className="px-5 py-3">{fmtDate(p.date)}</td>
                                        <td className="px-5 py-3 text-right">{(Number(p.amount) || 0).toLocaleString("ru-RU")} ₽</td>
                                        <td className="px-5 py-3 text-right">
                                            {amAdmin ? (
                                                <button
                                                    className="inline-flex h-8 px-3 items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-700"
                                                    onClick={() => deletePayment(p.id)}
                                                >
                                                    Удалить
                                                </button>
                                            ) : <span className="text-slate-400">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-5">
                    <Link href={`/projects/${id}`} className="underline text-slate-600 hover:text-slate-900">
                        ← Вернуться к проекту
                    </Link>
                </div>
            </section>
        </div>
    );
}
