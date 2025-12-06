const express = require('express');
const router = express.Router();

// Контроллеры задач
const {
    createTask,
    getTasksForUser,
    updateTaskReport,
    getAllTasks,
    updateTaskStatus,
    updateTask,
    getTaskById,
} = require('../controllers/task.controller');

// Контроллеры записей задачи (комментарии + файлы)
const {
    createTaskEntry,
    getTaskEntries,
    deleteTaskEntry,
} = require('../controllers/taskEntry.controller');

// Миддлвары авторизации и загрузки
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const { uploadPhotosAndFiles } = require('../middlewares/upload.middleware');

// Все маршруты требуют авторизации
router.use(verifyToken);

/* =========================
 *          TASKS
 * ========================= */

// 🔐 Только админ может создавать, смотреть все, и массово менять статус
router.post('/', requireRole('ADMIN'), createTask);
router.get('/all', requireRole('ADMIN'), getAllTasks);
router.patch('/:id/status', requireRole('ADMIN'), updateTaskStatus);

// 👷 Задачи текущего пользователя
router.get('/my', getTasksForUser);

// ✅ Одна задача по ID (права доступа проверяются внутри контроллера)
router.get('/:id', getTaskById);

// ✅ Полное обновление задачи (права внутри контроллера)
router.put('/:id', updateTask);

// ✅ Старый отчёт с фото (оставлено для совместимости; можно удалить позже)
router.patch(
    '/:id/report',
    (req, res, next) => next(), // заглушка, если ранее был multer.fields([{ name: 'photo' }])
    updateTaskReport
);

/* =========================
 *      TASK ENTRIES
 *  (комментарии + файлы)
 * ========================= */

// Список записей задачи
router.get('/:id/entries', getTaskEntries);

// Добавить запись (multipart: photos[], files[])
// uploadPhotosAndFiles обеспечивает сохранение в
// /uploads/project_<PID>/task_<TID> и заполняет req._uploadCtx.{absDir,relDir}
router.post('/:id/entries', uploadPhotosAndFiles, createTaskEntry);

// Удалить запись
router.delete('/:taskId/entries/:entryId', deleteTaskEntry);

module.exports = router;
