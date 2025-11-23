const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    createTask,
    getTasksForUser,
    updateTaskReport,
    getAllTasks,
    updateTaskStatus,
    updateTask,
    getTaskById,        // ⬅️ добавили
} = require('../controllers/task.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// 🔐 Только админ
router.post('/', requireRole('ADMIN'), createTask);
router.get('/all', requireRole('ADMIN'), getAllTasks);
router.patch('/:id/status', requireRole('ADMIN'), updateTaskStatus);

// 👷 Работник
router.get('/my', getTasksForUser);

// ✅ Одна задача по ID (доступно всем авторизованным, права проверяются внутри)
router.get('/:id', getTaskById);    // ⬅️ НОВОЕ

// ✅ Обновление задачи
router.put('/:id', updateTask);

// ✅ Отчет с фото
router.patch('/:id/report', upload.fields([{ name: 'photo' }]), updateTaskReport);

module.exports = router;
