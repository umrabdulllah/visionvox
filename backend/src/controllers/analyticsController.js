const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async trackPageVisit(req, res) {
    try {
      const { page, timeSpent } = req.body;
      const userId = req.user._id;
      const analytics = await analyticsService.trackPageVisit(userId, page, timeSpent);
      res.json(analytics);
    } catch (error) {
      console.error('Error in trackPageVisit:', error);
      res.status(500).json({ error: 'Failed to track page visit' });
    }
  }

  async getUserAnalytics(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const analytics = await analyticsService.getUserAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      res.status(500).json({ error: 'Failed to get user analytics' });
    }
  }
}

module.exports = new AnalyticsController();
