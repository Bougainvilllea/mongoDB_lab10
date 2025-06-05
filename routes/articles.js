const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Tag = require('../models/Tag');

// Получить все статьи с фильтрацией и сортировкой
router.get('/', async (req, res) => {
  try {
    let query;
    
    // Копируем query параметры
    const reqQuery = { ...req.query };
    
    // Поля для исключения
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Удаляем поля из query
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Создаем строку запроса
    let queryStr = JSON.stringify(reqQuery);
    
    // Добавляем $ к операторам (для gt, gte и т.д.)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Поиск по тегам (если указаны)
    if (reqQuery.tags) {
      const tags = await Tag.find({ name: { $in: reqQuery.tags.split(',') } });
      const tagIds = tags.map(tag => tag._id);
      query = Article.find({ tags: { $in: tagIds } });
    } else {
      query = Article.find(JSON.parse(queryStr));
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
    const articles = await query.populate('tags', 'name').exec();
    
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
    
    res.status(200).json({
      success: true,
      count: articles.length,
      pagination,
      data: articles
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Получить одну статью по ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('tags', 'name');
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Создать новую статью
router.post('/', async (req, res) => {
  try {
    // Проверяем существование тегов
    const tags = await Tag.find({ _id: { $in: req.body.tags } });
    
    if (tags.length !== req.body.tags.length) {
      return res.status(400).json({
        success: false,
        error: 'Один или несколько тегов не существуют'
      });
    }
    
    const article = await Article.create(req.body);
    
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Обновить статью
router.put('/:id', async (req, res) => {
  try {
    // Проверяем существование тегов, если они обновляются
    if (req.body.tags) {
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({
          success: false,
          error: 'Один или несколько тегов не существуют'
        });
      }
    }
    
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Удалить статью
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Добавить рецензию к статье
router.post('/:id/reviews', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    article.reviews.push(req.body);
    await article.save();
    
    res.status(201).json({
      success: true,
      data: article.reviews
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Получить рецензии статьи
router.get('/:id/reviews', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      count: article.reviews.length,
      data: article.reviews
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

module.exports = router;