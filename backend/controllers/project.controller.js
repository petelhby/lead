const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Создание проекта
const createProject = async (req, res) => {
    try {
        const { name, description, budget, deadline } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                budget: Number(budget),
                deadline: new Date(deadline),
                createdById: req.user.id,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Ошибка при создании проекта:', error);
        res.status(500).json({ message: 'Ошибка при создании проекта', error: error.message });
    }
};

// ✅ Получение всех проектов (добавлен createdAt)
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
                createdAt: true, // ✅ теперь возвращается
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(projects);
    } catch (error) {
        console.error('Ошибка при получении проектов:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов', error: error.message });
    }
};

// ✅ Обновление проекта
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const updated = await prisma.project.update({
            where: { id: Number(id) },
            data: { name, description },
        });

        res.json(updated);
    } catch (error) {
        console.error('Ошибка при обновлении проекта:', error);
        res.status(500).json({ message: 'Ошибка при обновлении проекта', error: error.message });
    }
};

// ✅ Удаление проекта и связанных задач
const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.task.deleteMany({ where: { projectId: Number(id) } });
        await prisma.project.delete({ where: { id: Number(id) } });

        res.json({ message: 'Проект удалён' });
    } catch (error) {
        console.error('Ошибка при удалении проекта:', error);
        res.status(500).json({ message: 'Ошибка при удалении проекта', error: error.message });
    }
};

// Заглушка для обновления статуса
const updateProjectStatus = async (req, res) => {
    // реализация при необходимости
};

module.exports = {
    createProject,
    getAllProjects,
    updateProject,
    updateProjectStatus,
    deleteProject,
};
