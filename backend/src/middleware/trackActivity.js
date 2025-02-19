const analyticsService = require('../services/analyticsService');

const trackActivity = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.user?._id;

  // Only track for authenticated users
  if (!userId) {
    return next();
  }

  // Store the original end function
  const originalEnd = res.end;

  // Override the end function
  res.end = async function(...args) {
    const timeSpent = Date.now() - startTime;
    const path = req.path;

    try {
      // Track the page visit asynchronously
      analyticsService.trackPageVisit(userId, path, timeSpent)
        .catch(error => console.error('Error tracking activity:', error));
    } catch (error) {
      console.error('Error in trackActivity middleware:', error);
    }

    // Call the original end function
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = trackActivity;
