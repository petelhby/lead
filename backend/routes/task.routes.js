const express = require('express');
const router = express.Router();
const multer = require('multer');

// Используем память как временное хранилище
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    createTask,
    getTasksForUser,
    updateTaskReport,
    getAllTasks,
    updateTaskStatus,
} = require('../controllers/task.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// 🔐 Только админ
router.post('/', requireRole('ADMIN'), createTask);
router.get('/all', requireRole('ADMIN'), getAllTasks);
router.patch('/:id/status', requireRole('ADMIN'), updateTaskStatus);

// 👷 Работник
router.get('/my', getTasksForUser);

// ✅ Загрузка нескольких фото в отчёте
router.patch('/:id/report', upload.fields([{ name: 'photo' }]), updateTaskReport);

module.exports = router;
