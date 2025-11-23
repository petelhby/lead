// backend/controllers/task.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

/** Допустимые статусы задач */
const TASK_STATUSES = new Set([
    'Новая',
    'Принят к исполнению',
    'Выполнен, требует проверки',
    'Закрыта',
]);

/* ------------------------------------------------------------------ */
/*                         ADMIN  –  СОЗДАТЬ ЗАДАЧУ                    */
/* ------------------------------------------------------------------ */
exports.createTask = async (req, res) => {
    try {
        const { title, dueDate, projectId, assignedToId, description } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description: description ?? '',
                // dueDate может быть пустым — тогда не записываем
                ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
                projectId: Number(projectId),
                ...(assignedToId != null ? { assignedToId: Number(assignedToId) } : {}),
                status: 'Новая',
            },
        });

        res.status(201).json(task);
    } catch (err) {
        console.error('[createTask]', err);
        res.status(500).json({ message: 'Ошибка при создании задачи', error: err.message });
    }
};

/* ------------------------------------------------------------------ */
/*                         WORKER  –  МОИ ЗАДАЧИ                       */
/* ------------------------------------------------------------------ */
exports.getTasksForUser = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { assignedToId: req.user.id },
            include: { project: true, assignedTo: true },
        });
        res.json(tasks);
    } catch (err) {
        console.error('[getTasksForUser]', err);
        res.status(500).json({ message: 'Ошибка при получении задач', error: err.message });
    }
};

/* ------------------------------------------------------------------ */
/*                         ADMIN  –  ВСЕ ЗАДАЧИ                        */
/* ------------------------------------------------------------------ */
exports.getAllTasks = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const where = projectId ? { projectId: Number(projectId) } : {};

        const tasks = await prisma.task.findMany({
            where,
            include: { assignedTo: true, project: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(tasks);
    } catch (err) {
        console.error('[getAllTasks]', err);
        res.status(500).json({ message: 'Ошибка при получении всех задач', error: err.message });
    }
};

/* ------------------------------------------------------------------ */
/*                WORKER  –  ОТПРАВИТЬ ОТЧЁТ (PATCH /:id/report)       */
/* ------------------------------------------------------------------ */
exports.updateTaskReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { report, status } = req.body;
        const files = req.files?.photo || []; // поле photo (если используете такой роут)

        /* ---------- сохраняем фото в uploads/<project>/<task>/ --------- */
        let photoUrls = [];

        if (files.length) {
            // берём проект и задачу для slug-папки
            const task = await prisma.task.findUnique({
                where: { id: Number(id) },
                include: { project: true },
            });

            const projectSlug = slugify(task.project.name, { lower: true });
            const taskSlug = slugify(task.title, { lower: true });

            const folderPath = path.join(__dirname, '..', 'uploads', projectSlug, taskSlug);
            fs.mkdirSync(folderPath, { recursive: true });

            for (const file of files) {
                const fileName = `${Date.now()}_${file.originalname}`;
                const filePath = path.join(folderPath, fileName);
                fs.writeFileSync(filePath, file.buffer);

                photoUrls.push(
                    path.join('uploads', projectSlug, taskSlug, fileName).replace(/\\/g, '/')
                );
            }
        }

        /* ---------- создаём под-запись TaskEntry ----------------------- */
        const newEntry = await prisma.taskEntry.create({
            data: {
                taskId: Number(id),
                authorId: req.user.id,
                report: report || '',
                photos: photoUrls, // String[]
            },
            include: { author: { select: { id: true, name: true } } },
        });

        /* ---------- при необходимости меняем статус самой задачи ------- */
        if (typeof status === 'string' && TASK_STATUSES.has(status)) {
            await prisma.task.update({
                where: { id: Number(id) },
                data: { status },
            });
        }

        res.json(newEntry);
    } catch (err) {
        console.error('[updateTaskReport]', err);
        res.status(500).json({ message: 'Ошибка при отправке отчёта', error: err.message });
    }
};

/* ------------------------------------------------------------------ */
/*                         ADMIN  –  ОБНОВИТЬ СТАТУС                   */
/* ------------------------------------------------------------------ */
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== 'string' || !TASK_STATUSES.has(status)) {
            return res.status(400).json({ message: 'Недопустимый статус задачи' });
        }

        const updated = await prisma.task.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Задача не найдена' });
        }
        console.error('[updateTaskStatus]', err);
        res.status(500).json({ message: 'Ошибка при обновлении статуса', error: err.message });
    }
};

/* ------------------------------------------------------------------ */
/*             ОБЩЕЕ ОБНОВЛЕНИЕ ЗАДАЧИ (PUT /api/tasks/:id)            */
/*           (статус, заголовок, описание, срок, исполнитель)          */
/* ------------------------------------------------------------------ */
exports.updateTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Некорректный id' });

        const {
            title,
            description,
            status,
            deadline,     // поддержим оба имени
            dueDate,      // поддержим оба имени
            assignedToId,
        } = req.body || {};

        const data = {};

        if (typeof title === 'string') data.title = title;
        if (typeof description === 'string') data.description = description;

        if (typeof status === 'string') {
            if (!TASK_STATUSES.has(status)) {
                return res.status(400).json({ message: 'Недопустимый статус задачи' });
            }
            data.status = status;
        }

        const dateValue = deadline || dueDate;
        if (dateValue) {
            const d = new Date(dateValue);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ message: 'Некорректная дата дедлайна' });
            }
            // у тебя в модели, судя по контроллерам, поле называется dueDate
            data.dueDate = d;
        }

        if (assignedToId != null) {
            const v = Number(assignedToId);
            if (Number.isNaN(v)) {
                return res.status(400).json({ message: 'Некорректный assignedToId' });
            }
            data.assignedToId = v;
        }

        const updated = await prisma.task.update({
            where: { id },
            data,
        });

        res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Задача не найдена' });
        }
        console.error('[updateTask]', err);
        res.status(500).json({ message: 'Не удалось обновить задачу', error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id: Number(id) } });
        res.json({ ok: true });
    } catch (err) {
        console.error('[deleteTask]', err);
        res.status(500).json({ message: 'Ошибка при удалении задачи', error: err.message });
    }
};

// ...вверху файла уже есть prisma

// ---------- ПОЛУЧИТЬ ОДНУ ЗАДАЧУ ПО ID, с проверкой прав ----------
exports.getTaskById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: { select: { id: true, name: true } },
                project: true,
                entries: {
                    orderBy: { createdAt: "desc" },
                    include: { author: { select: { id: true, name: true } } },
                },
            },
        });

        if (!task) return res.status(404).json({ message: "Задача не найдена" });

        // ADMIN видит всё; WORKER — только если назначен на эту задачу
        const role = String(req.user?.role || "").toUpperCase();
        const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN" || role === "SUPERADMIN" || role === "SUPER_ADMIN";

        if (!isAdmin && task.assignedToId !== req.user.id) {
            return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }

        res.json(task);
    } catch (err) {
        console.error("[getTaskById]", err);
        res.status(500).json({ message: "Ошибка при получении задачи", error: err.message });
    }
};

