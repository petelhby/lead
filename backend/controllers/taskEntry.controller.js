const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

const createTaskEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { report, status } = req.body;
        const files = req.files || [];

        const task = await prisma.task.findUnique({
            where: { id: Number(id) },
            include: { project: true },
        });

        if (!task) return res.status(404).json({ message: 'Задача не найдена' });

        const projectSlug = slugify(task.project.name, { lower: true });
        const taskSlug = slugify(task.title, { lower: true });
        const folderPath = path.join(__dirname, '..', 'uploads', projectSlug, taskSlug);
        fs.mkdirSync(folderPath, { recursive: true });

        const photoUrls = files.map((file) => {
            const fileName = `${Date.now()}_${file.originalname}`;
            const filePath = path.join(folderPath, fileName);
            fs.writeFileSync(filePath, file.buffer);
            return path.join('uploads', projectSlug, taskSlug, fileName).replace(/\\/g, '/');
        });

        const newEntry = await prisma.taskEntry.create({
            data: {
                taskId: Number(id),
                report,
                photos: photoUrls,
                authorId: req.user.id,
            },
        });

        // Обновим статус задачи, если передан
        if (status) {
            await prisma.task.update({
                where: { id: Number(id) },
                data: { status },
            });
        }

        res.status(201).json(newEntry);
    } catch (err) {
        console.error('Ошибка при создании записи:', err);
        res.status(500).json({ message: 'Не удалось создать запись', error: err.message });
    }
};

const getTaskEntries = async (req, res) => {
    try {
        const { id } = req.params;
        const entries = await prisma.taskEntry.findMany({
            where: { taskId: Number(id) },
            include: {
                author: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при получении записей', error: err.message });
    }
};

module.exports = { createTaskEntry, getTaskEntries };
