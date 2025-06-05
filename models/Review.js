const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Пожалуйста, укажите имя'],
    trim: true,
    maxlength: [50, 'Имя не может превышать 50 символов']
  },
  text: {
    type: String,
    required: [true, 'Пожалуйста, добавьте текст отзыва'],
    maxlength: [500, 'Отзыв не может превышать 500 символов']
  },
  rating: {
    type: Number,
    required: [true, 'Пожалуйста, укажите оценку от 1 до 10'],
    min: 1,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', ReviewSchema);