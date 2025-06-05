const express = require('express');
const router = express.Router();
const { registerWorker, login } = require('../controllers/auth.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register-worker', verifyToken, requireRole('ADMIN'), registerWorker); // Только админ может

module.exports = router;
