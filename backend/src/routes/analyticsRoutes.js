const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// Track page visit (requires authentication)
router.post('/track', auth, analyticsController.trackPageVisit);

// Get user analytics (requires admin access)
router.get('/users', auth, analyticsController.getUserAnalytics);

module.exports = router;
