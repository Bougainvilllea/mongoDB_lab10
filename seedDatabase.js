const mongoose = require('mongoose');
const Article = require('./models/Article');
const Tag = require('./models/Tag');

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/scientific-journal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Подключение к MongoDB установлено');

    // Очистка коллекций
    await Article.deleteMany({});
    await Tag.deleteMany({});
    console.log('Существующие данные очищены');

    // Создание тегов
    const tags = await Tag.insertMany([
      { name: 'Физика' },
      { name: 'Математика' },
      { name: 'Химия' },
      { name: 'Биология' },
      { name: 'Информатика' },
      { name: 'Астрономия' },
      { name: 'Генетика' },
      { name: 'Экология' }
    ]);
    console.log('Теги созданы:', tags.map(t => t.name).join(', '));

    // Массив статей с порядковыми номерами в названиях
    const articlesData = [
      {
        title: '1. Квантовая механика для начинающих',
        authors: ['Иван Петров', 'Мария Сидорова'],
        content: 'Основные принципы квантовой механики и их применение в современных технологиях...',
        tags: [tags[0]._id, tags[1]._id],
        publishDate: new Date('2023-01-15'),
        reviews: [
          { userName: 'Алексей', text: 'Отличное введение в тему!', rating: 9 },
          { userName: 'Студент', text: 'Сложновато для новичков', rating: 6 }
        ]
      },
      {
        title: '2. Новые методы синтеза органических соединений',
        authors: ['Анна Иванова'],
        content: 'Современные подходы к синтезу сложных органических молекул...',
        tags: [tags[2]._id],
        publishDate: new Date('2023-02-20'),
        reviews: [
          { userName: 'Химик', text: 'Практически полезный материал', rating: 8 }
        ]
      },
      {
        title: '3. Машинное обучение в медицине',
        authors: ['Петр Сергеев', 'Ольга Кузнецова'],
        content: 'Применение алгоритмов ИИ для диагностики заболеваний...',
        tags: [tags[4]._id, tags[6]._id],
        publishDate: new Date('2023-03-10'),
        reviews: [
          { userName: 'Врач', text: 'Перспективное направление', rating: 9 },
          { userName: 'Программист', text: 'Хорошие примеры кода', rating: 8 }
        ]
      },
      {
        title: '4. Экологические проблемы мегаполисов',
        authors: ['Дмитрий Смирнов'],
        content: 'Анализ экологической ситуации в крупных городах и пути решения...',
        tags: [tags[7]._id],
        publishDate: new Date('2023-04-05'),
        reviews: []
      },
      {
        title: '5. Теория струн: современное состояние',
        authors: ['Сергей Попов', 'Елена Васильева'],
        content: 'Актуальные исследования в области теории струн и их значение...',
        tags: [tags[0]._id, tags[5]._id],
        publishDate: new Date('2023-05-12'),
        reviews: [
          { userName: 'Физик-теоретик', text: 'Отличный обзор', rating: 10 }
        ]
      },
      {
        title: '6. Биоинформатика и анализ геномов',
        authors: ['Александр Ковалев'],
        content: 'Методы компьютерного анализа генетических данных...',
        tags: [tags[3]._id, tags[4]._id, tags[6]._id],
        publishDate: new Date('2023-06-18'),
        reviews: [
          { userName: 'Генетик', text: 'Полезный практический материал', rating: 9 }
        ]
      },
      {
        title: '7. Дифференциальные уравнения в физике',
        authors: ['Мария Сидорова'],
        content: 'Применение дифференциальных уравнений для решения физических задач...',
        tags: [tags[0]._id, tags[1]._id],
        publishDate: new Date('2023-07-22'),
        reviews: [
          { userName: 'Студент Физтеха', text: 'Хорошие примеры задач', rating: 8 }
        ]
      },
      {
        title: '8. Нанотехнологии в медицине',
        authors: ['Ольга Кузнецова', 'Иван Петров'],
        content: 'Перспективы использования наноматериалов для доставки лекарств...',
        tags: [tags[2]._id, tags[3]._id],
        publishDate: new Date('2023-08-30'),
        reviews: []
      },
      {
        title: '9. Космология и тёмная материя',
        authors: ['Сергей Попов'],
        content: 'Современные теории о природе тёмной материи и её роли во Вселенной...',
        tags: [tags[0]._id, tags[5]._id],
        publishDate: new Date('2023-09-14'),
        reviews: [
          { userName: 'Астроном', text: 'Отличный научный обзор', rating: 10 },
          { userName: 'Любитель', text: 'Слишком сложно для меня', rating: 5 }
        ]
      },
      {
        title: '10. Криптография и квантовые компьютеры',
        authors: ['Александр Ковалев', 'Дмитрий Смирнов'],
        content: 'Как квантовые вычисления изменят современные методы шифрования...',
        tags: [tags[0]._id, tags[1]._id, tags[4]._id],
        publishDate: new Date('2023-10-05'),
        reviews: [
          { userName: 'Криптограф', text: 'Важная тема для специалистов', rating: 9 }
        ]
      }
    ];

    // Добавление статей в базу данных
    const articles = await Article.insertMany(articlesData);

    console.log(`Добавлено ${articles.length} статей`);
    
    // Вывод информации о добавленных статьях с номерами
    console.log('\nДобавленные статьи:');
    articles.forEach(article => {
      console.log(`${article.title} (${article.authors.join(', ')})`);
    });

    await mongoose.disconnect();
    console.log('\nСоединение с MongoDB закрыто');
  } catch (err) {
    console.error('Ошибка при заполнении базы данных:', err);
    process.exit(1);
  }
}

seedDatabase();