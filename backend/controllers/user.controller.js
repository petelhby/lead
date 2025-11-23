// backend/controllers/user.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** GET /api/users — список пользователей для назначения задачи */
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, isActive: true },
            orderBy: { name: 'asc' },
        });
        res.json(users);
    } catch (e) {
        console.error('[getAllUsers]', e);
        res.status(500).json({ message: 'Ошибка при получении пользователей', error: e.message });
    }
};

module.exports = { getAllUsers };
