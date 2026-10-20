// Квиз: содержание и порядок вопросов — как на сайте oazis.estate.
// Каждый вопрос может получить поле showIf(answers) => boolean, чтобы стать условным
// (например, скрыть «комнаты» для коммерческой недвижимости). Сейчас все вопросы показываются всегда.

export const QUIZ = [
  {
    id: 'type',
    title: 'Какой объект вы ищете?',
    options: [
      { value: 'flat', label: 'Квартира', icon: 'building' },
      { value: 'apartments', label: 'Апартаменты', icon: 'hotel' },
      { value: 'house', label: 'Дом / таунхаус', icon: 'house' },
      { value: 'commercial', label: 'Коммерческая недвижимость', icon: 'store' },
    ],
  },
  {
    id: 'purpose',
    title: 'Для каких целей?',
    options: [
      { value: 'live', label: 'Для жизни', icon: 'sun' },
      { value: 'invest', label: 'Для инвестиций', icon: 'trend' },
      { value: 'rent', label: 'Под сдачу в аренду', icon: 'key' },
      { value: 'unsure', label: 'Пока не определился', icon: 'compass' },
    ],
  },
  {
    id: 'rooms',
    title: 'Сколько комнат нужно?',
    // showIf: (a) => a.type !== 'commercial',
    options: [
      { value: 'studio', label: 'Студия', short: '', icon: 'area' },
      { value: '1', label: '1 комната', short: '1' },
      { value: '2', label: '2 комнаты', short: '2' },
      { value: '3plus', label: '3 и более', short: '3+' },
    ],
  },
  {
    id: 'budget',
    title: 'Какой бюджет рассматриваете?',
    options: [
      { value: 'lt5', label: 'До 5 млн ₽', min: 0, max: 5 },
      { value: '5to10', label: '5–10 млн ₽', min: 5, max: 10 },
      { value: '10to20', label: '10–20 млн ₽', min: 10, max: 20 },
      { value: 'gt20', label: 'Более 20 млн ₽', min: 20, max: Infinity },
    ],
  },
  {
    id: 'payment',
    title: 'Какой способ покупки?',
    options: [
      { value: 'mortgage', label: 'Ипотека', icon: 'bank' },
      { value: 'installment', label: 'Рассрочка', icon: 'calendar' },
      { value: 'cash', label: 'Полная оплата', icon: 'wallet' },
      { value: 'consult', label: 'Нужна консультация', icon: 'chat' },
    ],
  },
];
