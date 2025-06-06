const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

const createTask = async (req, res) => {
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
        res.status(500).json({ message: 'Ошибка при создании задачи', error: err.message });
    }
};

const getTasksForUser = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { assignedToId: req.user.id },
            include: { project: true },
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при получении задач', error: err.message });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const where = projectId ? { projectId: Number(projectId) } : {};

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: true,
                project: true,
            },
        });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при получении всех задач', error: err.message });
    }
};

const updateTaskReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { report, status } = req.body;
        const files = req.files?.photo || [];

        let photoUrls = [];

        if (files && files.length > 0) {
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
                const relativePath = path.join('uploads', projectSlug, taskSlug, fileName).replace(/\\/g, '/');
                photoUrls.push(relativePath);
            }
        }

        const updated = await prisma.task.update({
            where: { id: Number(id) },
            data: {
                report,
                photoUrl: photoUrls, // теперь целый массив
                status: status || 'Выполнен, требует проверки',
            },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при отправке отчёта', error: err.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.task.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при обновлении статуса', error: err.message });
    }
};

module.exports = {
    createTask,
    getTasksForUser,
    getAllTasks,
    updateTaskReport,
    updateTaskStatus,
};
