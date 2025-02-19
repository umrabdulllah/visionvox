const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const auth = require('../middleware/auth');

// All routes should be protected
router.use(auth);

router.post('/:projectId', scriptController.createScript);
router.get('/:projectId', scriptController.getScripts);
router.get('/:projectId/:scriptId', scriptController.getScript);
router.patch('/:projectId/scripts/:scriptId', scriptController.updateScript);
router.delete('/:projectId/scripts/:scriptId', scriptController.deleteScript);

// Visual suggestions routes
router.post('/scripts/:scriptId/visuals', scriptController.addVisualSuggestion);
router.delete('/scripts/:scriptId/visuals/:visualId', scriptController.removeVisualSuggestion);

module.exports = router; 