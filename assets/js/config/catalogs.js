// Каталоги. Чтобы добавить новый:
// 1) положите PDF и нарезанные страницы (p01.jpg, p02.jpg…) в папку catalogs/<id>/
// 2) обложку — в assets/img/covers/<id>.jpg
// 3) добавьте запись ниже.

export const CATALOGS = [
  {
    id: 'sochi-top10',
    title: 'ТОП-10 Сочи',
    subtitle: 'Сочи и побережье',
    description: 'Подборка курортных объектов Сочи, Адлера и побережья Туапсинского района — для сдачи в аренду, перепродажи и личного отдыха.',
    tags: ['Море', 'Сочи', 'Агой'],
    cover: 'assets/img/covers/sochi-top10.jpg',
    pdf: 'catalogs/sochi-top10/oazis-sochi-top10.pdf',
    pages: 11,
    objectsCount: 10,
  },
  {
    id: 'krasnaya-polyana',
    title: 'Красная Поляна',
    subtitle: 'Горы Сочи · осень 2026',
    description: 'Объекты Красной Поляны, Розы Хутор и Эсто-Садка: сервисные апартаменты у подъёмников и готовые проекты.',
    tags: ['Горы', 'Роза Хутор', 'Эсто-Садок'],
    cover: 'assets/img/covers/krasnaya-polyana.jpg',
    pdf: 'catalogs/krasnaya-polyana/oazis-krasnaya-polyana.pdf',
    pages: 9,
    objectsCount: 8,
  },
  {
    id: 'altai',
    title: 'Алтай',
    subtitle: 'Катунь, Белокуриха, Горно-Алтайск',
    description: 'Курортная недвижимость Алтая: сервисные отели, апарт-комплексы и жилые кварталы у Катуни. Все объекты — по 214-ФЗ.',
    tags: ['Горы', 'Катунь', 'Белокуриха'],
    cover: 'assets/img/covers/altai.jpg',
    pdf: 'catalogs/altai/oazis-altai.pdf',
    pages: 8,
    objectsCount: 7,
  },
  {
    id: 'ski',
    title: 'Горнолыжные курорты',
    subtitle: 'Алтай, Шерегеш, Домбай, Архыз, Поляна',
    description: 'Инвестиционные объекты в лучших горных регионах России — от Шерегеша и Домбая до Красной Поляны.',
    tags: ['Горы', 'Шерегеш', 'Домбай', 'Архыз'],
    cover: 'assets/img/covers/ski.jpg',
    pdf: 'catalogs/ski/oazis-ski.pdf',
    pages: 16,
    objectsCount: 15,
  },
  {
    id: 'investor',
    title: 'Каталог инвестора',
    subtitle: 'Премиальная курортная недвижимость',
    description: 'Объекты для инвестиционного портфеля: Сочи, Агой, Анапа, Ялта, Евпатория, Алтай и Роза Хутор.',
    tags: ['Инвестиции', 'Море и горы', 'Крым'],
    cover: 'assets/img/covers/investor.jpg',
    pdf: 'catalogs/investor/oazis-investor.pdf',
    pages: 17,
    objectsCount: 16,
  },
];
