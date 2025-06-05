// Импорт необходимых модулей и моделей
const mongoose = require('mongoose'); // Импорт библиотеки Mongoose для работы с MongoDB
const Review = require('./Review'); // Импорт модели Review (отзывы на статью)
const Tag = require('./Tag'); // Импорт модели Tag (теги для статей)

// Создание схемы (структуры) для модели Article (статья)
const ArticleSchema = new mongoose.Schema({
  // Поле "title" - название статьи
  title: {
    type: String, // Тип данных - строка
    required: [true, 'Пожалуйста, добавьте название статьи'], // Обязательное поле с сообщением об ошибке
    trim: true, // Автоматическое удаление пробелов в начале и конце строки
    maxlength: [200, 'Название статьи не может превышать 200 символов'] // Максимальная длина с сообщением об ошибке
  },
  // Поле "authors" - авторы статьи
  authors: {
    type: [String], // Тип данных - массив строк
    required: [true, 'Пожалуйста, укажите авторов'] // Обязательное поле с сообщением об ошибке
  },
  // Поле "publishDate" - дата публикации
  publishDate: {
    type: Date, // Тип данных - дата
    default: Date.now // Значение по умолчанию - текущая дата и время
  },
  // Поле "content" - содержание статьи
  content: {
    type: String, // Тип данных - строка
    required: [true, 'Пожалуйста, добавьте содержание статьи'] // Обязательное поле с сообщением об ошибке
  },
  // Поле "tags" - теги статьи (связь с моделью Tag)
  tags: {
    type: [mongoose.Schema.Types.ObjectId], // Тип данных - массив ObjectId (идентификаторов)
    ref: 'Tag', // Ссылка на модель Tag для популяции (заполнения) данных
    required: true // Обязательное поле
  },
  // Поле "reviews" - отзывы на статью (встроенные документы по схеме Review)
  reviews: [Review.schema], // Массив отзывов, использующих схему Review
  // Поле "averageRating" - средний рейтинг статьи
  averageRating: {
    type: Number, // Тип данных - число
    min: [1, 'Рейтинг должен быть не менее 1'], // Минимальное значение с сообщением об ошибке
    max: [10, 'Рейтинг должен быть не более 10'] // Максимальное значение с сообщением об ошибке
  }
});

// Middleware (пред-сохранение): расчет среднего рейтинга перед сохранением документа
ArticleSchema.pre('save', function(next) {
  // Проверяем, есть ли отзывы и не пустой ли массив
  if (this.reviews && this.reviews.length > 0) {
    // Считаем сумму всех рейтингов (reduce проходит по всем элементам массива)
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    // Вычисляем средний рейтинг (сумма / количество отзывов)
    this.averageRating = sum / this.reviews.length;
  } else {
    // Если отзывов нет, устанавливаем рейтинг в 0
    this.averageRating = 0;
  }
  // Передаем управление следующему middleware
  next();
});

// Экспорт модели Article на основе созданной схемы
module.exports = mongoose.model('Article', ArticleSchema);
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

module.exports = mongoose.model('Article', ArticleSchema);
