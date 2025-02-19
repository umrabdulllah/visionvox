const mongoose = require('mongoose');

const pageVisitSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  lastVisit: {
    type: Date,
    default: Date.now
  }
});

const userAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  pageVisits: [pageVisitSchema],
  sessionCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);
