const express = require('express');
const router = express.Router();
const {
    createProject,
    getAllProjects,
    updateProjectStatus,
    deleteProject,
} = require('../controllers/project.controller');

const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Только админ
router.post('/', requireRole('ADMIN'), createProject);
router.get('/', getAllProjects);
router.patch('/:id/status', requireRole('ADMIN'), updateProjectStatus);
router.delete('/:id', requireRole('ADMIN'), deleteProject);

module.exports = router;
