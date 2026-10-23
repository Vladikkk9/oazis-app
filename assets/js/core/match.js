// Подбор объектов по ответам квиза.
// Принципы: только факты из каталогов; если совпадений мало — показываем меньше, а не придумываем.

import { OBJECTS, CATALOG_NAMES } from '../config/objects.js?v=7';
import { QUIZ } from '../config/quiz.js?v=7';

export const TYPE_LABEL = { flat: 'Квартира', apartments: 'Апартаменты', null: 'Формат уточняется' };

export function minPrice(o) {
  const v = Object.values(o.prices || {});
  return v.length ? Math.min(...v) : null;
}

export function priceSources(o) {
  return Object.entries(o.prices || {})
    .map(([cat, value]) => ({ catalog: cat, name: CATALOG_NAMES[cat], value }))
    .sort((a, b) => a.value - b.value);
}

export function objectCatalogs(o) {
  return [...new Set([...Object.keys(o.prices || {}), ...(o.catalogs || [])])];
}

export function hasPriceConflict(o) {
  const v = Object.values(o.prices || {});
  return v.length > 1 && Math.max(...v) - Math.min(...v) > 0.001;
}

export const fmtMln = (v) =>
  v == null ? 'по запросу' : `${v.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;

const opt = (qid, value) => QUIZ.find((q) => q.id === qid)?.options.find((o) => o.value === value);

function bucket(answers) {
  const b = opt('budget', answers.budget);
  return b ? { min: b.min, max: b.max, label: b.label } : { min: 0, max: Infinity, label: 'любой' };
}

const inBudget = (p, b) => p != null && p >= b.min && p <= b.max;
const purposeOk = (o, a) => !a.purpose || a.purpose === 'unsure' || o.purposes.includes(a.purpose);
const roomsMismatch = (o, a) => Array.isArray(o.rooms) && a.rooms && !o.rooms.includes(a.rooms);

function reasons(o, a, b) {
  const r = [];
  const p = minPrice(o);
  if (o.type !== a.type) r.push(`Другой формат: ${TYPE_LABEL[o.type].toLowerCase()}`);
  if (inBudget(p, b)) r.push(`Цена от ${fmtMln(p)} — в рамках бюджета «${b.label}»`);
  else if (p != null && p > b.max) r.push(`Выше бюджета «${b.label}»: цена от ${fmtMln(p)}`);
  else if (p != null && p < b.min) r.push(`Дешевле бюджета «${b.label}»: цена от ${fmtMln(p)}`);

  if (a.purpose === 'rent' && o.purposes.includes('rent'))
    r.push('В каталоге указан оператор или управляющая компания — сдавать можно без самостоятельного управления');
  else if (a.purpose === 'live' && o.purposes.includes('live'))
    r.push(`Подходит для жизни: ${o.perks[0].toLowerCase()}`);
  else if (a.purpose === 'invest' && o.purposes.includes('rent'))
    r.push('Есть оператор или управляющая компания — доход без самостоятельного управления');

  const roomsOpt = opt('rooms', a.rooms);
  if (Array.isArray(o.rooms) && o.rooms.includes(a.rooms)) r.push(`В продаже есть варианты «${roomsOpt.label}»`);
  else if (roomsOpt && o.area?.[0])
    r.push(`Площади ${o.area[0]}${o.area[1] ? `–${o.area[1]}` : '+'} м² — планировку «${roomsOpt.label.toLowerCase()}» уточнит менеджер`);

  if (a.payment === 'installment' && o.installment) r.push(o.installment);
  if (a.payment === 'mortgage' && o.escrow) r.push('Покупка по 214-ФЗ через эскроу');
  if (o.ready) r.push('Объект уже сдан');
  return r;
}

// Выбор с разнообразием регионов: сначала по одному объекту из разных регионов.
function diversePick(list, n) {
  const out = [];
  const seen = new Set();
  for (const o of list) if (out.length < n && !seen.has(o.region)) { out.push(o); seen.add(o.region); }
  for (const o of list) if (out.length < n && !out.includes(o)) out.push(o);
  return out;
}

export function match(answers) {
  const a = answers;
  const b = bucket(a);
  const pool = OBJECTS.filter((o) => o.type); // объекты с неуказанным форматом в квиз не попадают

  const exact = pool
    .filter((o) => o.type === a.type && inBudget(minPrice(o), b) && purposeOk(o, a) && !roomsMismatch(o, a))
    .sort((x, y) => scoreOf(y, a) - scoreOf(x, a) || minPrice(x) - minPrice(y));

  let open = diversePick(exact, 3).map((o) => ({ o, reasons: reasons(o, a, b) }));
  let mode = 'exact';

  // Нет точных совпадений — честно показываем ближайшие варианты с пометкой.
  if (!open.length) {
    const sameType = pool.filter((o) => o.type === a.type && minPrice(o) != null);
    if (sameType.length) {
      mode = 'near-budget';
      // Ближе по цене — выше; несовпадение по цели покупки — штраф, но не исключение.
      const dist = (o) => {
        const p = minPrice(o);
        return (p < b.min ? b.min - p : p > b.max ? p - b.max : 0) + (purposeOk(o, a) ? 0 : 3);
      };
      open = sameType.sort((x, y) => dist(x) - dist(y)).slice(0, 2).map((o) => ({ o, reasons: reasons(o, a, b), near: true }));
    } else {
      mode = 'other-format';
      const alt = pool
        .filter((o) => inBudget(minPrice(o), b) && purposeOk(o, a))
        .sort((x, y) => minPrice(x) - minPrice(y));
      open = diversePick(alt, 2).map((o) => ({ o, reasons: reasons(o, a, b), near: true }));
    }
  }

  const hidden = hiddenOffers(a, b, open.map((x) => x.o), exact);
  return { mode, open, hidden, budget: b, exactCount: exact.length };
}

function scoreOf(o, a) {
  let s = 0;
  if (Array.isArray(o.rooms) && o.rooms.includes(a.rooms)) s += 3;
  if (a.payment === 'installment' && o.installment) s += 3;
  if (a.payment === 'mortgage' && o.escrow) s += 1;
  if (a.purpose === 'live' && o.purposes.includes('live')) s += 2;
  if (a.purpose === 'rent' && o.purposes.includes('rent')) s += 2;
  if (o.ready) s += 1;
  return s;
}

// Дополнительные предложения: у каждого — реальное, проверяемое по каталогу преимущество.
function hiddenOffers(a, b, openList, exact) {
  const used = new Set(openList.map((o) => o.id));
  const pool = OBJECTS.filter((o) => o.type && !used.has(o.id) && purposeOk(o, a));
  const near = (o) => {
    const p = minPrice(o);
    return p != null && p >= b.min * 0.75 && p <= (b.max === Infinity ? Infinity : b.max * 1.2);
  };
  const out = [];
  const take = (o, kind, text) => {
    if (o && !used.has(o.id) && out.length < 4) { used.add(o.id); out.push({ o, kind, text }); }
  };

  const openMin = openList.length ? Math.min(...openList.map(minPrice).filter((x) => x != null)) : null;

  // 1. Похожий вариант дешевле
  if (openMin) {
    const cheaper = pool
      .filter((o) => o.type === a.type && minPrice(o) != null && minPrice(o) < openMin && near(o))
      .sort((x, y) => minPrice(y) - minPrice(x))[0];
    if (cheaper) {
      const pct = Math.round((1 - minPrice(cheaper) / openMin) * 100);
      if (pct >= 3) take(cheaper, 'price', `Стоимость «от» на ${pct}% ниже, чем у открытых вариантов`);
    }
  }
  // 2. Подтверждённая рассрочка
  take(pool.find((o) => o.installment && near(o)), 'installment', 'Рассрочка указана в каталоге');
  // 3. Готовый объект
  take(pool.find((o) => o.ready && near(o) && (o.type === a.type || !exact.length)), 'ready', 'Объект уже сдан — без ожидания стройки');
  // 4. Локация
  const isLoc = (o) => near(o) && (o.tags.includes('coast') || o.tags.includes('lifts'));
  const loc = pool.find((o) => isLoc(o) && o.type === a.type) || pool.find(isLoc);
  if (loc) take(loc, 'location', loc.tags.includes('coast') ? 'Первая береговая линия' : 'Рядом с подъёмниками');
  // 5. Другой формат под ту же цель
  take(pool.find((o) => o.type !== a.type && inBudget(minPrice(o), b)), 'format', 'Другой формат под ту же цель и бюджет');
  // 6. Старт продаж
  if (a.budget === 'gt20' || a.budget === '10to20')
    take(pool.find((o) => o.priceOnRequest), 'start', 'Старт продаж — цены по запросу');
  // 7. Ещё точные совпадения
  for (const o of exact) take(o, 'more', 'Ещё вариант точно под ваши параметры');

  return out;
}
