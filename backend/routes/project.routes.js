const express = require('express');
const router = express.Router();

const {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    updateProjectStatus,
    deleteProject,
} = require('../controllers/project.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Создание (только админ)
router.post('/', requireRole('ADMIN'), createProject);

// Список + деталь
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Обновление проекта целиком
router.put('/:id', requireRole('ADMIN'), updateProject);

// Обновление только статуса
router.patch('/:id/status', requireRole('ADMIN'), updateProjectStatus);

// Удаление
router.delete('/:id', requireRole('ADMIN'), deleteProject);

module.exports = router;
