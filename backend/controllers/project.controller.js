const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ createProject
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                createdById: req.user.id, // ← убедись, что req.user доступен
            },
        });

        res.status(201).json(project);
    } catch (error) {
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
const deleteProject = async (req, res) => { /* ... */ };

module.exports = {
    createProject,
    getAllProjects,
    updateProject,
    updateProjectStatus,
    deleteProject,
};
// Добавь сюда остальные функции, как в примере выше