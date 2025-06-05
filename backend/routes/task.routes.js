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
} = require('../controllers/task.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Только админ
router.post('/', requireRole('ADMIN'), createTask);
router.get('/all', requireRole('ADMIN'), getAllTasks);

// Работник
router.get('/my', getTasksForUser);
router.patch('/:id/report', upload.single('photo'), updateTaskReport); // ✅ только один раз!

module.exports = router;
