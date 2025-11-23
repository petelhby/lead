// controllers/project.controller.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Валидные статусы проекта */
const PROJECT_STATUSES = new Set(["IN_PROGRESS", "PAUSED", "CLOSED", "PAID"]);

/** Хелперы нормализации входящих данных (JS, без типов) */
function toNullableNumber(v) {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function toNullableDate(v) {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function toNullableString(v) {
    if (v === undefined) return undefined;
    if (v === null || String(v).trim() === "") return null;
    return String(v);
}

function toProjectStatus(v) {
    if (v === undefined) return undefined;
    const s = String(v);
    return PROJECT_STATUSES.has(s) ? s : undefined;
}

// ✅ Создание проекта
const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            budget,
            deadline,      // срок сдачи (ISO/строка)
            createdAt,     // дата старта (необязательно)
            address,
            contactPerson,
            phone,
            contactEmail,  // ✅ новое
            notes,         // ✅ новое
            status,        // IN_PROGRESS | PAUSED | CLOSED | PAID
        } = req.body || {};

        if (!name) {
            return res.status(400).json({ message: "Поле name обязательно" });
        }

        const data = {
            name: String(name),
            description: toNullableString(description),
            budget: toNullableNumber(budget),
            deadline: toNullableDate(deadline),
            createdAt: toNullableDate(createdAt),
            address: toNullableString(address),
            contactPerson: toNullableString(contactPerson),
            phone: toNullableString(phone),
            contactEmail: toNullableString(contactEmail), // ✅
            notes: toNullableString(notes),               // ✅
            status: toProjectStatus(status) ?? "IN_PROGRESS",
            createdById: req.user?.id ?? null,
        };

        const project = await prisma.project.create({ data });
        res.status(201).json(project);
    } catch (error) {
        console.error("Ошибка при создании проекта:", error);
        res.status(500).json({ message: "Ошибка при создании проекта", error: error.message });
    }
};

// ✅ Получение всех проектов (включая новые поля)
const getAllProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                budget: true,
                status: true,
                deadline: true,
                createdById: true,
                userId: true,
                createdAt: true,
                address: true,
                contactPerson: true,
                phone: true,
                contactEmail: true, // ✅
                notes: true,        // ✅
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(projects);
    } catch (error) {
        console.error("Ошибка при получении проектов:", error);
        res.status(500).json({ message: "Ошибка при получении проектов", error: error.message });
    }
};

// ✅ Получение одного проекта по id
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                name: true,
                description: true,
                budget: true,
                status: true,
                deadline: true,
                createdById: true,
                userId: true,
                createdAt: true,
                address: true,
                contactPerson: true,
                phone: true,
                contactEmail: true, // ✅
                notes: true,        // ✅
            },
        });
        if (!project) return res.status(404).json({ message: "Проект не найден" });
        res.json(project);
    } catch (error) {
        console.error("Ошибка при получении проекта:", error);
        res.status(500).json({ message: "Ошибка при получении проекта", error: error.message });
    }
};

// ✅ Обновление проекта (все поля формы настроек)
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            budget,
            createdAt,     // "Срок начала"
            deadline,      // "Срок сдачи"
            address,
            contactPerson,
            phone,
            contactEmail,  // ✅
            notes,         // ✅
            status,        // IN_PROGRESS | PAUSED | CLOSED | PAID
        } = req.body || {};

        const data = {
            name: name !== undefined ? String(name) : undefined,
            description: toNullableString(description),
            budget: toNullableNumber(budget),
            createdAt: toNullableDate(createdAt),
            deadline: toNullableDate(deadline),
            address: toNullableString(address),
            contactPerson: toNullableString(contactPerson),
            phone: toNullableString(phone),
            contactEmail: toNullableString(contactEmail), // ✅
            notes: toNullableString(notes),               // ✅
            status: toProjectStatus(status),
        };

        const updated = await prisma.project.update({
            where: { id: Number(id) },
            data,
        });

        res.json(updated);
    } catch (error) {
        console.error("Ошибка при обновлении проекта:", error);
        res.status(500).json({ message: "Ошибка при обновлении проекта", error: error.message });
    }
};

// ✅ Удаление проекта и связанных задач
const deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.task.deleteMany({ where: { projectId: Number(id) } });
        await prisma.project.delete({ where: { id: Number(id) } });
        res.json({ message: "Проект удалён" });
    } catch (error) {
        console.error("Ошибка при удалении проекта:", error);
        res.status(500).json({ message: "Ошибка при удалении проекта", error: error.message });
    }
};

// (опционально) Обновление только статуса
const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const s = toProjectStatus(req.body?.status);
        if (!s) return res.status(400).json({ message: "Неверный статус проекта" });

        const updated = await prisma.project.update({
            where: { id: Number(id) },
            data: { status: s },
        });

        res.json(updated);
    } catch (error) {
        console.error("Ошибка при обновлении статуса проекта:", error);
        res.status(500).json({ message: "Ошибка при обновлении статуса проекта", error: error.message });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    updateProjectStatus,
    deleteProject,
};
