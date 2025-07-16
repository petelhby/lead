// backend/controllers/task.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

/* ------------------------------------------------------------------ */
/*                         ADMIN  –  СОЗДАТЬ ЗАДАЧУ                    */
/* ------------------------------------------------------------------ */
exports.createTask = async (req, res) => {
    try {
        const { title, dueDate, projectId, assignedToId, description } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                projectId: Number(projectId),
                assignedToId: Number(assignedToId),
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
            include: { project: true },
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
        const files = req.files?.photo || [];   // поле photo, not images

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
                photos: photoUrls,     // String[]
            },
            include: { author: { select: { id: true, name: true } } },
        });

        /* ---------- при необходимости меняем статус самой задачи ------- */
        if (status) {
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

        const updated = await prisma.task.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json(updated);
    } catch (err) {
        console.error('[updateTaskStatus]', err);
        res.status(500).json({ message: 'Ошибка при обновлении статуса', error: err.message });
    }
};
