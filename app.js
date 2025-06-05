// Импорт необходимых модулей
const express = require('express'); // Импорт фреймворка Express для создания сервера
const mongoose = require('mongoose'); // Импорт Mongoose для работы с MongoDB
const path = require('path'); // Встроенный модуль Node.js для работы с путями файлов
const Article = require('./models/Article'); // Импорт модели Article
const Tag = require('./models/Tag'); // Импорт модели Tag

const app = express(); // Создание экземпляра Express приложения

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/scientific-journal', {
  useNewUrlParser: true, // Опции для правильного парсинга URL
  useUnifiedTopology: true // Использование нового механизма управления подключением
})
.then(() => console.log('Connected to MongoDB')) // Успешное подключение
.catch(err => console.error('Connection error:', err)); // Обработка ошибок подключения

// Middleware
app.use(express.json()); // Парсинг JSON в теле запросов
app.use(express.static(path.join(__dirname, 'public'))); // Обслуживание статических файлов из папки public

// API Routes

// Маршрут для получения списка статей с возможностью фильтрации, сортировки и пагинации
app.get('/api/articles', async (req, res) => {
  try {
    let query;
    
    // Копируем query параметры из запроса, чтобы не изменять оригинал
    const reqQuery = { ...req.query };
    
    // Поля, которые нужно удалить из query, так как они используются для других целей
    const removeFields = ['select', 'sort', 'page', 'limit', 'startDate', 'endDate'];
    
    // Удаляем специальные поля из query
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Преобразуем query в строку для дальнейшей обработки
    let queryStr = JSON.stringify(reqQuery);
    
    // Добавляем $ к операторам сравнения (gt, gte, lt, lte, in)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Создаем базовый запрос с возможностью фильтрации и подгрузки тегов
    query = Article.find(JSON.parse(queryStr)).populate('tags');
    
    // Фильтр по дате публикации, если указаны startDate и endDate
    if (req.query.startDate && req.query.endDate) {
      query = query.where('publishDate').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }
    
    // Выбор определенных полей, если указан параметр select
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' '); // Преобразуем "field1,field2" в "field1 field2"
      query = query.select(fields);
    }
    
    // Сортировка результатов
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' '); // Аналогично select
      query = query.sort(sortBy);
    } else {
      query = query.sort('-publishDate'); // Сортировка по дате публикации по умолчанию (новые сначала)
    }
    
    // Настройка пагинации
    const page = parseInt(req.query.page, 10) || 1; // Текущая страница (по умолчанию 1)
    const limit = parseInt(req.query.limit, 10) || 10; // Количество элементов на странице (по умолчанию 10)
    const startIndex = (page - 1) * limit; // Индекс первого элемента на странице
    const endIndex = page * limit; // Индекс последнего элемента на странице
    const total = await Article.countDocuments(); // Общее количество документов
    
    query = query.skip(startIndex).limit(limit); // Пропускаем элементы до startIndex и ограничиваем количество
    
    // Выполнение запроса
    const articles = await query;
    
    // Формирование информации о пагинации для ответа
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = { // Информация о следующей странице, если она есть
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = { // Информация о предыдущей странице, если она есть
        page: page - 1,
        limit
      };
    }
    
    // Отправка успешного ответа с данными
    res.json({
      success: true,
      count: articles.length,
      pagination,
      data: articles
    });
  } catch (err) {
    res.status(500).json({ error: err.message }); // Обработка ошибок
  }
});

// Маршрут для получения топ-статей
app.get('/api/articles/top', async (req, res) => {
  try {
    const articles = await Article.find().populate('tags');
    
    // Обработка статей для расчета рейтинга
    const sortedArticles = articles
      .map(article => {
        // Расчет среднего рейтинга статьи
        const avgRating = article.reviews && article.reviews.length > 0 
          ? article.reviews.reduce((acc, review) => acc + review.rating, 0) / article.reviews.length
          : 0;
        return {
          ...article.toObject(), // Преобразуем mongoose документ в обычный объект
          avgRating,
          reviewsCount: article.reviews ? article.reviews.length : 0
        };
      })
      .sort((a, b) => {
        // Сначала сортируем по рейтингу, затем по количеству рецензий
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        return b.reviewsCount - a.reviewsCount;
      })
      .slice(0, 5); // Берем только 5 лучших статей
    
    res.json(sortedArticles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для поиска статей
app.get('/api/articles/search', async (req, res) => {
  try {
    const { title, author, startDate, endDate } = req.query;
    let query = {};
    
    // Поиск по названию (регистронезависимый)
    if (title) query.title = { $regex: title, $options: 'i' };
    // Поиск по автору
    if (author) query.authors = author;
    // Фильтр по дате публикации
    if (startDate && endDate) {
      query.publishDate = {
        $gte: new Date(startDate), // Больше или равно startDate
        $lte: new Date(endDate) // Меньше или равно endDate
      };
    }
    
    const articles = await Article.find(query).populate('tags');
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для получения конкретной статьи по ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('tags');
    
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }
    
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для создания новой статьи
app.post('/api/articles', async (req, res) => {
  try {
    // Проверка существования указанных тегов
    if (req.body.tags && req.body.tags.length > 0) {
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      // Если количество найденных тегов не совпадает с запрошенными
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({ error: 'Один или несколько тегов не существуют' });
      }
    }
    
    // Создание новой статьи
    const article = await Article.create(req.body);
    res.status(201).json(article); // 201 - Created
  } catch (err) {
    res.status(400).json({ error: err.message }); // 400 - Bad Request
  }
});

// Маршрут для обновления статьи
app.put('/api/articles/:id', async (req, res) => {
  try {
    // Проверка существования тегов, если они обновляются
    if (req.body.tags) {
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({ error: 'Один или несколько тегов не существуют' });
      }
    }
    
    // Поиск и обновление статьи
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Возвращать обновленный документ
      runValidators: true // Запускать валидаторы Mongoose
    }).populate('tags');
    
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }
    
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Маршрут для удаления статьи
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршруты для работы с тегами

// Получение списка всех тегов
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
