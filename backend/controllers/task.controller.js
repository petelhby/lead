const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const createTask = async (req, res) => {
    try {
        const { title, dueDate, projectId, assignedToId } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                dueDate: new Date(dueDate),
                projectId: Number(projectId),
                assignedToId: Number(assignedToId),
            },
        });

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: 'Error creating task', error: err.message });
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
        res.status(500).json({ message: 'Error fetching tasks', error: err.message });
    }
};

const updateTaskReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { report } = req.body;

        let photoUrl = null;

        if (req.file) {
            const filename = `${Date.now()}-${req.file.originalname}`;
            const uploadPath = path.join(__dirname, '..', 'uploads', filename);
            fs.writeFileSync(uploadPath, req.file.buffer);
            photoUrl = `/uploads/${filename}`;
        }

        const task = await prisma.task.update({
            where: { id: Number(id) },
            data: { report, photoUrl },
        });

        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Error updating task', error: err.message });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: { assignedTo: true, project: true },
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tasks', error: err.message });
    }
};

module.exports = {
    createTask,
    getTasksForUser,
    updateTaskReport,
    getAllTasks,
};
