const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Только ADMIN: проверка роли (если у вас уже есть мидлвара — можете не дублировать) */
function assertAdmin(req) {
    const role = (req.user?.role || "").toUpperCase();
    if (role !== "ADMIN" && role !== "ROLE_ADMIN" && role !== "SUPERADMIN" && role !== "SUPER_ADMIN") {
        const err = new Error("Access denied: admin only");
        err.status = 403;
        throw err;
    }
}

/** Приводим сумму к Decimal совместимой строке */
function toAmount(v) {
    if (v == null || v === "") return "0";
    // принимаем строку/число, заменяем запятую
    const n = String(v).replace(",", ".").trim();
    return /^\d+(\.\d+)?$/.test(n) ? n : "0";
}

function toDate(v) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
}

/** Получить сводку по проекту: договоры, платежи и итоги */
const getFinanceForProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        const [contracts, payments] = await Promise.all([
            prisma.contract.findMany({
                where: { projectId },
                orderBy: [{ date: "asc" }, { id: "asc" }],
            }),
            prisma.payment.findMany({
                where: { projectId },
                orderBy: [{ date: "asc" }, { id: "asc" }],
            }),
        ]);

        // Итоги
        const totalContracts = contracts.reduce((s, c) => s + Number(c.amount), 0);
        const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
        const debt = totalContracts - totalPayments;

        res.json({
            contracts,
            payments,
            totals: {
                totalContracts,
                totalPayments,
                debt,
            },
        });
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({ message: e.message || "Finance fetch error" });
    }
};

/** Создать договор или доп. соглашение */
const createContract = async (req, res) => {
    try {
        assertAdmin(req);
        const projectId = Number(req.params.id);
        const { title, date, amount } = req.body || {};

        const created = await prisma.contract.create({
            data: {
                projectId,
                title: String(title || "Договор"),
                date: toDate(date),
                amount: toAmount(amount),
            },
        });
        res.status(201).json(created);
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({ message: e.message || "Create contract error" });
    }
};

/** Удалить договор (каскадом удалять платежи не будем; запретим если есть платежи) */
const deleteContract = async (req, res) => {
    try {
        assertAdmin(req);
        const id = Number(req.params.contractId);
        const payments = await prisma.payment.count({ where: { contractId: id } });
        if (payments > 0) {
            return res.status(400).json({ message: "Нельзя удалить договор: к нему привязаны платежи" });
        }
        await prisma.contract.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({ message: e.message || "Delete contract error" });
    }
};

/** Создать платеж (аванс/оплата), опционально привязываем к договору */
const createPayment = async (req, res) => {
    try {
        assertAdmin(req);
        const projectId = Number(req.params.id);
        const { contractId, kind, date, amount } = req.body || {};

        const created = await prisma.payment.create({
            data: {
                projectId,
                contractId: contractId ? Number(contractId) : null,
                kind: String(kind || "Платеж"),
                date: toDate(date),
                amount: toAmount(amount),
            },
        });
        res.status(201).json(created);
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({ message: e.message || "Create payment error" });
    }
};

const deletePayment = async (req, res) => {
    try {
        assertAdmin(req);
        const id = Number(req.params.paymentId);
        await prisma.payment.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({ message: e.message || "Delete payment error" });
    }
};

module.exports = {
    getFinanceForProject,
    createContract,
    deleteContract,
    createPayment,
    deletePayment,
};
