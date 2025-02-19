const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  projectType: {
    type: String,
    enum: ['video', 'script', 'both'],
    required: true
  },
  videos: [{
    title: String,
    url: String,
    duration: Number,
    thumbnail: String,
    timeline: {
      clips: [{
        id: String,
        trackIndex: Number,
        start: Number,
        end: Number,
        assetId: String
      }],
      duration: Number,
      lastEdited: Date
    },
    assets: [{
      id: String,
      url: String,
      type: String,
      name: String,
      duration: Number,
      thumbnail: String
    }],
    createdAt: { type: Date, default: Date.now },
    lastEdited: { type: Date, default: Date.now }
  }],
  scripts: [{
    title: String,
    content: String,
    timestamp: Number, // Maps to video timeline
    version: Number,
    status: {
      type: String,
      enum: ['draft', 'final', 'archived'],
      default: 'draft'
    },
    aiSuggestions: [{
      type: String,
      suggestion: String,
      timestamp: Date
    }],
    createdAt: { type: Date, default: Date.now },
    lastEdited: { type: Date, default: Date.now }
  }],
  lastEdited: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update lastEdited timestamp on any modification
projectSchema.pre('save', function(next) {
  this.lastEdited = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema); 