// Направление: все объекты региона из базы objects.js.

import { AGENCY } from '../config/agency.js?v=3';
import { OBJECTS } from '../config/objects.js?v=3';
import { esc, plural } from '../core/ui.js?v=3';
import { minPrice } from '../core/match.js?v=3';
import { header, photo, objectCard } from './parts.js?v=3';
import { notFound } from './catalogs.js?v=3';

const objectsOf = (r) =>
  OBJECTS.filter((o) => r.match.includes(o.region))
    .sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));

export function regionStats() {
  return AGENCY.regions
    .map((r) => {
      const list = objectsOf(r);
      const prices = list.map(minPrice).filter((p) => p != null);
      return { ...r, count: list.length, from: prices.length ? Math.min(...prices) : null };
    })
    .filter((r) => r.count > 0);
}

export function region({ id }) {
  const r = AGENCY.regions.find((x) => x.id === id);
  if (!r) return notFound();
  const list = objectsOf(r);

  return {
    tab: 'home',
    back: true,
    html: `
    ${header({ title: r.name })}
    <section class="cat-hero">
      ${photo(r.image, r.name, { eager: true })}
      <div class="panel glass-dark" style="grid-template-columns:1fr">
        <div>
          <h1 class="t-h2" style="color:#fff">${esc(r.name)}</h1>
          <p class="t-small">${list.length} ${plural(list.length, ['объект', 'объекта', 'объектов'])} в каталогах OAZIS ESTATE</p>
        </div>
      </div>
    </section>
    <div class="obj-grid stagger mt-24">${list.map((o, i) => objectCard(o, [], { i })).join('')}</div>
    <div class="wrap mt-24">
      <a class="btn btn-primary btn-block" href="#/quiz" data-action="quiz-start">Подобрать под мою задачу</a>
    </div>`,
  };
}
