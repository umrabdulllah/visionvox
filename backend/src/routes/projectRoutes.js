const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const videoController = require('../controllers/videoController');
const auth = require('../middleware/auth');
const scriptRoutes = require('./scriptRoutes');

// All routes are protected
router.use(auth);

// Project routes
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Video editing routes
router.post('/:id/video/trim', videoController.trimVideo);
router.post('/:id/video/merge', videoController.mergeVideos);
router.post('/:id/video/export', videoController.exportVideo);
router.post('/:id/video/thumbnail', videoController.generateThumbnail);
router.post('/:id/video/preview', videoController.generatePreview);

router.post('/:id/video', projectController.addVideoToProject);
router.use('/:projectId/scripts', scriptRoutes);

module.exports = router;