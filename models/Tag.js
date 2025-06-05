const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите название тега'],
    unique: true,
    trim: true,
    maxlength: [50, 'Название тега не может превышать 50 символов']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tag', TagSchema);