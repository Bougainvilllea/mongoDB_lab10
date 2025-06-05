const mongoose = require('mongoose');
const Review = require('./Review');
const Tag = require('./Tag');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, добавьте название статьи'],
    trim: true,
    maxlength: [200, 'Название статьи не может превышать 200 символов']
  },
  authors: {
    type: [String],
    required: [true, 'Пожалуйста, укажите авторов']
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: [true, 'Пожалуйста, добавьте содержание статьи']
  },
  tags: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Tag',
    required: true
  },
  reviews: [Review.schema],
  averageRating: {
    type: Number,
    min: [1, 'Рейтинг должен быть не менее 1'],
    max: [10, 'Рейтинг должен быть не более 10']
  }
});

// Рассчет среднего рейтинга перед сохранением
ArticleSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

module.exports = mongoose.model('Article', ArticleSchema);