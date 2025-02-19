const mongoose = require('mongoose');

const userImportsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  importedAt: {
    type: Date,
    default: Date.now
  }
});

const UserImports = mongoose.model('UserImports', userImportsSchema);
module.exports = UserImports; 