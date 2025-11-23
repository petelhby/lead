// backend/routes/taskEntry.routes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const {
    createTaskEntry,
    getTaskEntries,
    deleteTaskEntry,        // ⬅️ добавили
} = require('../controllers/taskEntry.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

// Готовим папку для загрузок
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Храним файлы на диске, чтобы получить .path
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const id = req.params.id || req.params.taskId || 'task';
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '');
        cb(null, `task_${id}_${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 12 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});

router.use(verifyToken);

// Список записей задачи
router.get('/:id/entries', getTaskEntries);

// Создание записи (комментарий + фото)
// ВАЖНО: имя поля — 'photos' (совпадает с фронтом form.append("photos", file))
router.post('/:id/entries', upload.array('photos'), createTaskEntry);

// Удаление записи: /api/tasks/:taskId/entries/:entryId
router.delete('/:taskId/entries/:entryId', deleteTaskEntry); // ⬅️ добавили

module.exports = router;
