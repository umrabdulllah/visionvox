const mongoose = require('mongoose');

const visualSuggestionSchema = new mongoose.Schema({
  visualName: {
    type: String,
    required: true
  },
  relatedText: {
    type: String,
    required: true
  }
});

const scriptSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  generatedScript: {
    type: String,
    required: true
  },
  suggestedVisuals: [visualSuggestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scriptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Script = mongoose.model('Script', scriptSchema);
module.exports = Script; 