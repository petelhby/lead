const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createTaskEntry, getTaskEntries } = require('../controllers/taskEntry.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(verifyToken);

router.post('/:id/entries', upload.array('photo'), createTaskEntry);
router.get('/:id/entries', getTaskEntries); // ✅ Новый маршрут

module.exports = router;
