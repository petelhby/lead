const express = require('express');
const router = express.Router();

const {
    createTask,
    getTasksForUser,
    updateTaskReport,
    getAllTasks,
    updateTaskStatus,
    updateTask,
    getTaskById,
} = require('../controllers/task.controller');

const {
    createTaskEntry,
    getTaskEntries,
    deleteTaskEntry,
} = require('../controllers/taskEntry.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const { uploadPhotosAndFiles } = require('../middlewares/upload.middleware');

// Все /tasks требуют авторизации
router.use(verifyToken);

/* ===========================
 *           TASKS
 * =========================== */

// 🔐 Только админ
router.post('/', requireRole('ADMIN'), createTask);
router.get('/all', requireRole('ADMIN'), getAllTasks);
router.patch('/:id/status', requireRole('ADMIN'), updateTaskStatus);

// 👷 Работник
router.get('/my', getTasksForUser);

// ✅ Одна задача по ID (доступно всем авторизованным, права проверяются внутри контроллера)
router.get('/:id', getTaskById);

// ✅ Полное обновление задачи
router.put('/:id', updateTask);

// ✅ Старый отчёт с фото (если ещё используешь; можно оставить для совместимости)
router.patch('/:id/report',
    // здесь можно использовать упрощённый загрузчик, но оставим как было
    // если у тебя был собственный upload.fields([{ name: 'photo' }]) — можешь убрать или заменить
    (req, res, next) => next(),
    updateTaskReport
);

/* ===========================
 *         TASK ENTRIES
 *  (комментарии + файлы)
 * =========================== */

// Список записей задачи
router.get('/:id/entries', getTaskEntries);

// Добавить запись (multipart: photos[], files[])
router.post(
    '/:id/entries',
    uploadPhotosAndFiles, // кладёт файлы в /uploads и заполняет req.files.photos / req.files.files
    createTaskEntry
);

// Удалить запись
router.delete('/:taskId/entries/:entryId', deleteTaskEntry);

module.exports = router;
