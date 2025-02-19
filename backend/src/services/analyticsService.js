const UserAnalytics = require('../models/UserAnalytics');
const User = require('../models/User');

class AnalyticsService {
  async trackPageVisit(userId, page, timeSpent) {
    try {
      let analytics = await UserAnalytics.findOne({ userId });
      
      if (!analytics) {
        analytics = new UserAnalytics({ userId });
      }

      // Update or add page visit
      const existingVisit = analytics.pageVisits.find(v => v.page === page);
      if (existingVisit) {
        existingVisit.timeSpent += timeSpent;
        existingVisit.lastVisit = new Date();
      } else {
        analytics.pageVisits.push({
          page,
          timeSpent,
          lastVisit: new Date()
        });
      }

      analytics.totalTimeSpent += timeSpent;
      analytics.lastActive = new Date();
      analytics.sessionCount += 1;

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error tracking page visit:', error);
      throw error;
    }
  }

  async getUserAnalytics() {
    try {
      const analytics = await UserAnalytics.find().populate('userId', 'username email');
      return analytics.map(a => ({
        userId: a.userId._id,
        username: a.userId.username,
        email: a.userId.email,
        lastActive: a.lastActive,
        timeSpent: Math.round(a.totalTimeSpent / 60), // Convert to minutes
        pageVisits: a.pageVisits.map(v => ({
          page: v.page,
          timeSpent: Math.round(v.timeSpent / 60), // Convert to minutes
          lastVisit: v.lastVisit
        }))
      }));
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
