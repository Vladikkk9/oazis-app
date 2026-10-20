// Спецусловия и акции. Блок на главной и отметки в карточках объектов.
//
// ВАЖНО: показывайте здесь только подтверждённые застройщиком условия.
// Сейчас заполнено тем, что прямо указано в каталогах OAZIS ESTATE и постах канала —
// перед публикацией проверьте актуальность и укажите validUntil.
//
// Поля:
//   objectId   — id объекта из objects.js (карточка откроется по нажатию)
//   title      — суть предложения, коротко
//   text       — одна строка пояснения
//   source     — откуда взято условие (видно пользователю)
//   validUntil — 'ГГГГ-ММ-ДД' — после этой даты предложение скрывается само; null — без срока
//   url        — необязательно: ссылка на пост с подробностями

export const PROMOS = [
  {
    id: 'zhemchuzhina-start',
    objectId: 'zhemchuzhina',
    title: 'Закрытый старт продаж',
    text: 'Стартовые цены и выбор лотов до выхода в открытую продажу',
    source: 'пост канала от 14 октября',
    url: 'https://t.me/oazisestate/6693',
    validUntil: null,
  },
  {
    id: 'nikolai-installment',
    objectId: 'nikolai',
    title: 'Рассрочка на 2 года',
    text: 'Первый взнос — 30%',
    source: 'Каталог инвестора',
    validUntil: null,
  },
  {
    id: 'leeprime-views',
    objectId: 'leeprime',
    title: 'Старт продаж видовых лотов',
    text: 'Апартаменты в 300 м от подъёмников Розы Хутор',
    source: 'Каталог инвестора',
    validUntil: null,
  },
  {
    id: 'skybreeze-vat',
    objectId: 'sky-breeze',
    title: 'Возможен возврат НДС',
    text: 'Резиденции ski-in / ski-out на высоте 1 100 м',
    source: 'Каталог инвестора',
    validUntil: null,
  },
];

export function activePromos(today = new Date()) {
  const d = today.toISOString().slice(0, 10);
  return PROMOS.filter((p) => !p.validUntil || p.validUntil >= d);
}

export const promoFor = (objectId) => activePromos().find((p) => p.objectId === objectId) || null;
