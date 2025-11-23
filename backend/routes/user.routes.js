const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Текущий пользователь
router.get('/me', async (req, res) => {
    try {
        // req.user формируется в verifyToken
        const user = await prisma.user.findUnique({
            where: { id: Number(req.user.id) },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка', error: err.message });
    }
});

// Все работники (как было)
router.get('/workers', requireRole('ADMIN'), async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true },
        });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка', error: err.message });
    }
});

module.exports = router;
