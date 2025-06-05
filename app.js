const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Article = require('./models/Article');
const Tag = require('./models/Tag');

const app = express();

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/scientific-journal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Connection error:', err));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/articles', async (req, res) => {
  try {
    let query;
    
    // Копируем query параметры
    const reqQuery = { ...req.query };
    
    // Поля для исключения
    const removeFields = ['select', 'sort', 'page', 'limit', 'startDate', 'endDate'];
    
    // Удаляем поля из query
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Создаем строку запроса
    let queryStr = JSON.stringify(reqQuery);
    
    // Добавляем $ к операторам (для gt, gte и т.д.)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Поиск
    query = Article.find(JSON.parse(queryStr)).populate('tags');
    
    // Фильтр по дате
    if (req.query.startDate && req.query.endDate) {
      query = query.where('publishDate').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }
    
    // Выбор полей
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Сортировка
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-publishDate');
    }
    
    // Пагинация
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Article.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Выполнение запроса
    const articles = await query;
    
    // Пагинация в результате
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.json({
      success: true,
      count: articles.length,
      pagination,
      data: articles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Топ статей
app.get('/api/articles/top', async (req, res) => {
  try {
    const articles = await Article.find().populate('tags');
    
    // Сортируем статьи по рейтингу и количеству рецензий
    const sortedArticles = articles
      .map(article => {
        const avgRating = article.reviews && article.reviews.length > 0 
          ? article.reviews.reduce((acc, review) => acc + review.rating, 0) / article.reviews.length
          : 0;
        return {
          ...article.toObject(),
          avgRating,
          reviewsCount: article.reviews ? article.reviews.length : 0
        };
      })
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        return b.reviewsCount - a.reviewsCount;
      })
      .slice(0, 5); // Топ 5 статей
    
    res.json(sortedArticles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/articles/search', async (req, res) => {
  try {
    const { title, author, startDate, endDate } = req.query;
    let query = {};
    
    if (title) query.title = { $regex: title, $options: 'i' };
    if (author) query.authors = author;
    if (startDate && endDate) {
      query.publishDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const articles = await Article.find(query).populate('tags');
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.post('/api/articles', async (req, res) => {
  try {
    // Проверяем существование тегов
    if (req.body.tags && req.body.tags.length > 0) {
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({ error: 'Один или несколько тегов не существуют' });
      }
    }
    
    const article = await Article.create(req.body);
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    // Проверяем существование тегов, если они обновляются
    if (req.body.tags) {
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({ error: 'Один или несколько тегов не существуют' });
      }
    }
    
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('tags');
    
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }
    
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

// API для тегов
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