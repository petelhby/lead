const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Получить всех работников
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
