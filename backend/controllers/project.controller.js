const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ createProject
const createProject = async (req, res) => {
    try {
        const { name, description, budget, deadline } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                budget: Number(budget),
                deadline: new Date(deadline), // ✅ обязательно приводим к Date
                createdById: req.user.id,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Ошибка при создании проекта:', error);
        res.status(500).json({ message: 'Ошибка при создании проекта', error: error.message });
    }
};



// ✅ остальные обработчики тоже должны быть тут
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
        res.status(500).json({ message: 'Ошибка при обновлении проекта', error: error.message });
    }
};

// Пример заглушек, если нужно
const getAllProjects = async (req, res) => {
    const all = await prisma.project.findMany();
    res.json(all);
};
const updateProjectStatus = async (req, res) => { /* ... */ };
const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.task.deleteMany({ where: { projectId: Number(id) } }); // удалить задачи проекта
        await prisma.project.delete({ where: { id: Number(id) } });

        res.json({ message: 'Проект удалён' });
    } catch (error) {
        console.error('Ошибка при удалении проекта:', error);
        res.status(500).json({ message: 'Ошибка при удалении проекта' });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    updateProject,
    updateProjectStatus,
    deleteProject,
};
// Добавь сюда остальные функции, как в примере выше