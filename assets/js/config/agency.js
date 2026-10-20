// Информация об агентстве. Источник — официальный сайт https://oazis.estate/ и каталоги OAZIS ESTATE.
// Не добавляйте сюда цифры, которых нет на сайте или в официальных материалах.

export const AGENCY = {
  name: 'OAZIS ESTATE',
  tagline: 'Агентство курортной недвижимости России',
  lead: 'Квартиры, апартаменты и дома у моря и в горах — для жизни, отдыха и инвестиций.',

  // Цифры с главной страницы oazis.estate
  facts: [
    { value: '5,0', label: 'рейтинг на Яндекс Картах' },
    { value: '27', label: 'параметров проверки объекта' },
  ],
  factsSource: 'oazis.estate',

  founder: {
    name: 'Ольга Изосина',
    role: 'основатель и CEO Oazis Estate',
    quote:
      'Мы всегда честны с клиентом, это наш принцип. Показываем не только плюсы, но и минусы объектов, о которых не расскажет застройщик или собственник. С нами вы делаете осознанный выбор',
  },

  approach: [
    { icon: 'shield', title: 'Проверяем каждый объект', text: 'Оцениваем проект по 27 параметрам до того, как предложить его клиенту.' },
    { icon: 'scale', title: 'Говорим и о минусах', text: 'Показываем слабые стороны объектов, о которых не расскажет застройщик.' },
    { icon: 'handshake', title: 'Работаем напрямую', text: 'Прямые договоры с крупнейшими застройщиками Сочи, Крыма и юга России.' },
    { icon: 'route', title: 'Ведём сделку целиком', text: 'Контроль на всех этапах, юридическая чистота, помощь с оформлением и переездом.' },
  ],

  audiences: [
    {
      title: 'Инвесторам',
      share: '70% клиентов',
      points: ['Аналитика по каждому объекту', 'Проверенные застройщики', 'Контроль сделки на всех этапах'],
    },
    {
      title: 'Для жизни и отдыха',
      share: '30% клиентов',
      points: ['Объекты с видом и инфраструктурой', 'Юридическая чистота', 'Помощь с оформлением и переездом'],
    },
  ],

  services: ['Консультации', 'Аналитический центр', 'Оценка и проверка', 'Инвестиции', 'Услуги застройщикам'],

  // Направления: id — значение поля region у объектов в objects.js
  regions: [
    { id: 'sochi', match: ['Сочи'], name: 'Сочи и Адлер', image: 'assets/img/objects/volna.jpg' },
    { id: 'polyana', match: ['Красная Поляна'], name: 'Красная Поляна', image: 'assets/img/objects/leeprime.jpg' },
    { id: 'altai', match: ['Алтай'], name: 'Алтай', image: 'assets/img/objects/radiant-altai.jpg' },
    { id: 'tuapse', match: ['Туапсе'], name: 'Туапсе и Агой', image: 'assets/img/objects/palazzo.jpg' },
    { id: 'crimea', match: ['Крым'], name: 'Крым', image: 'assets/img/objects/darsan.jpg' },
    { id: 'anapa', match: ['Анапа'], name: 'Анапа', image: 'assets/img/objects/nikolai.jpg' },
    { id: 'sheregesh', match: ['Шерегеш'], name: 'Шерегеш', image: 'assets/img/objects/altyn-shor.jpg' },
    { id: 'kchr', match: ['Домбай', 'Архыз'], name: 'Домбай и Архыз', image: 'assets/img/objects/amanauz.jpg' },
  ],

  contacts: {
    phone: '8 800 222 09 44',
    phoneHref: 'tel:88002220944',
    email: 'oazisrealestate@ya.ru',
    address: 'Сочи, ул. 20 Горнострелковой дивизии, 18А',
    site: 'https://oazis.estate/',
    policy: 'https://oazis.estate/policy/',
    channel: 'https://t.me/oazisestate',
    manager: 'https://t.me/oazis_estate',
    vk: 'https://vk.com/oazis.estate',
  },
};
