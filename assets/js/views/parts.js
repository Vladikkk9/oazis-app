// Переиспользуемые куски разметки.

import { esc, icon, fmtDate } from '../core/ui.js';
import { tg } from '../core/tg.js';
import { minPrice, fmtMln, TYPE_LABEL, hasPriceConflict } from '../core/match.js';
import { APP } from '../config/app.js';
import { promoFor } from '../config/promos.js';

// Фото со скелетом загрузки. Класс .ready ставит app.js по событию load.
export const photo = (src, alt = '', { eager = false, cls = '' } = {}) =>
  `<div class="ph ${cls}"><img src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>`;

// Плавающая шапка: стеклянные кнопки, заголовок проявляется при прокрутке.
export function header({ title = '', back = true, right = '', left = '' } = {}) {
  const showBack = back && !tg.inside; // в Telegram — системная кнопка «Назад»
  const l = left || (showBack ? `<button class="circle glass" data-action="back" aria-label="Назад">${icon('arrowL')}</button>` : '<span class="spacer"></span>');
  return `<header class="header" data-header>
    ${l}
    <div class="title">${esc(title)}</div>
    ${right || '<span class="spacer"></span>'}
  </header>`;
}

export function coverCard(c, i = 0) {
  return `<a class="cover" href="#/catalog/${c.id}" style="--i:${i}">
    ${photo(c.cover, `Обложка каталога «${c.title}»`)}
    <div class="t">${esc(c.title)}</div>
    <div class="s">${esc(c.subtitle)}</div>
  </a>`;
}

export function postRow(p, i = 0) {
  const meta = [p.topic, p.date ? fmtDate(p.date) : null].filter(Boolean).join(' · ');
  return `<button class="row-item" data-post="${p.id}" data-url="${esc(p.url)}" style="--i:${i}">
    <div>
      <div class="t-h3">${esc(p.title)}${p.placeholder ? '<span class="tag-draft">черновик</span>' : ''}</div>
      <div class="meta">${esc(meta)}</div>
    </div>
    ${icon('external', 'chev ic-sm')}
  </button>`;
}

export function postHero(p) {
  return `<button class="post-hero" data-post="${p.id}" data-url="${esc(p.url)}">
    ${photo(p.image, '')}
    <div class="panel glass-dark">
      <div class="t-h3">${esc(p.title)}</div>
      <div class="meta">${esc(p.topic)}${p.date ? ` · ${fmtDate(p.date)}` : ''} · Telegram</div>
    </div>
  </button>`;
}

export function priceText(o) {
  const p = minPrice(o);
  return p == null ? 'Цена по запросу' : `от ${fmtMln(p)}`;
}

export function specs(o) {
  const area = o.area?.[0] ? `${o.area[0]}${o.area[1] ? `–${o.area[1]}` : '+'} м²` : null;
  const done = o.ready ? o.completion : `сдача ${o.completion}`;
  return `<div class="specs"><span>${esc(o.highlight.value)} ${esc(o.highlight.label)}</span>${area ? `<span>${area}</span>` : ''}<span>${esc(done)}</span></div>`;
}

export function objectCard(o, reasons = [], { near = false, i = 0 } = {}) {
  const promo = promoFor(o.id);
  return `<article class="ocard" style="--i:${i}">
    <a class="photo" href="#/object/${o.id}" data-object-view="${o.id}" aria-label="${esc(o.name)}">
      ${photo(o.image, o.name)}
      <span class="badge glass-dark">${near ? 'Близкий вариант' : promo ? esc(promo.title) : esc(TYPE_LABEL[o.type] || o.format)}</span>
      <div class="panel glass-dark">
        <div class="t-h2">${esc(o.name)}</div>
        <div class="loc">${esc(o.location)}</div>
        <div class="price">${priceText(o)}${hasPriceConflict(o) ? ' <small>· цена различается в каталогах</small>' : ''}</div>
      </div>
    </a>
    <div class="body">
      ${specs(o)}
      ${reasons.length ? `<ul class="why">${reasons.slice(0, 4).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      <div class="actions"><a class="btn btn-tinted" href="#/object/${o.id}" data-object-view="${o.id}">Подробнее</a></div>
    </div>
  </article>`;
}

export function fineprint() {
  return `<p class="fineprint">Цены и характеристики — из ${esc(APP.pricesAsOf)}. В разных каталогах цена одного объекта может отличаться: актуальную стоимость и наличие лотов уточняет менеджер. Не является публичной офертой.</p>`;
}
