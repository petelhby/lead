const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createProject = async (req, res) => {
    try {
        const { name, description, budget, deadline } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                budget: parseFloat(budget),
                deadline: new Date(deadline),
                createdById: req.user.id,
            },
        });

        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: 'Error creating project', error: err.message });
    }
};

const getAllProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { createdBy: true, tasks: true },
        });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching projects', error: err.message });
    }
};

const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.project.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating status', error: err.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.project.delete({
            where: { id: Number(id) },
        });

        res.json({ message: 'Проект удалён' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при удалении проекта', error: err.message });
    }
};


const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updated = await prisma.project.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при обновлении проекта', error: err.message });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    updateProject,
    deleteProject,
};
