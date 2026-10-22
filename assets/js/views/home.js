import { AGENCY } from '../config/agency.js?v=3';
import { CATALOGS } from '../config/catalogs.js?v=3';
import { POSTS } from '../config/posts.js?v=3';
import { esc, icon, plural } from '../core/ui.js?v=3';
import { OBJECTS } from '../config/objects.js?v=3';
import { activePromos } from '../config/promos.js?v=3';
import { regionStats } from './region.js?v=3';
import { header, photo, coverCard, postRow, postHero } from './parts.js?v=3';

export function home() {
  const [first, ...rest] = POSTS;
  const promos = activePromos().filter((p) => OBJECTS.some((o) => o.id === p.objectId));
  const regions = regionStats();
  return {
    tab: 'home',
    html: `
    ${header({
      title: '',
      left: `<span class="logo-pill glass-dark"><span class="logo" role="img" aria-label="Oazis Estate"></span></span>`,
      right: `<button class="circle glass-dark" data-open="${AGENCY.contacts.channel}" data-contact="channel" aria-label="Telegram-канал">${icon('telegram')}</button>`,
    })}

    <section class="hero">
      ${photo('assets/img/objects/montvert.jpg', 'Курортный комплекс на побережье Сочи', { eager: true })}
      <div class="hero-card glass-dark">
        <h1 class="t-hero">Курортная недвижимость у&nbsp;моря и&nbsp;в&nbsp;горах</h1>
        <p>Квартиры и апартаменты для жизни, отдыха и инвестиций — с честным разбором каждого проекта.</p>
        <div class="row">
          <a class="btn btn-white" href="#/quiz" data-action="quiz-start">Подобрать объект</a>
          <a class="btn-glass" href="#/catalogs" aria-label="Каталоги">${icon('book')}</a>
        </div>
      </div>
    </section>

    <div class="facts" aria-label="OAZIS ESTATE в цифрах">
      ${AGENCY.facts.map((f) => `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}
    </div>

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">Каталоги</h2><a class="btn-plain" href="#/catalogs">Все</a></div>
      <div class="rail stagger">${CATALOGS.map(coverCard).join('')}</div>
    </section>

    ${promos.length ? `<section class="section">
      <div class="sec-head"><h2 class="t-h2">Спецусловия</h2></div>
      <div class="rail stagger">${promos.map((p, i) => {
        const o = OBJECTS.find((x) => x.id === p.objectId);
        return `<a class="promo" href="#/object/${o.id}" data-promo="${p.id}" style="--i:${i}">
          ${photo(o.image, '')}
          <div class="panel glass-dark">
            <b>${esc(p.title)}</b>
            <span>${esc(o.name)}, ${esc(o.region)}</span>
          </div>
        </a>`;
      }).join('')}</div>
      <p class="fineprint" style="margin-top:10px">Условия из каталогов и публикаций OAZIS ESTATE. Сроки и наличие уточняйте у менеджера.</p>
    </section>` : ''}

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">Направления</h2></div>
      <div class="rail stagger">${regions.map((r, i) => `<a class="tile" href="#/region/${r.id}" style="--i:${i}">
          ${photo(r.image, '')}
          <span class="label glass-dark">${esc(r.name)}<small>${r.count} ${plural(r.count, ['объект', 'объекта', 'объектов'])}</small>${r.from ? `<small>от ${r.from.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽</small>` : ''}</span>
        </a>`).join('')}</div>
    </section>

    <section class="section">
      <a class="feature" href="#/quiz" data-action="quiz-start">
        ${photo('assets/img/objects/kp960.jpg', '')}
        <div class="panel glass-dark">
          <div class="progress-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <h2 class="t-h2">Подборка за минуту</h2>
          <p>Пять вопросов — и сразу видно, какие проекты подходят. Контакты оставлять не нужно.</p>
          <span class="btn btn-white btn-block">Начать</span>
        </div>
      </a>
    </section>

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">Рекомендуем прочитать</h2><a class="btn-plain" href="#/read">Все</a></div>
      ${postHero(first)}
      <div class="group mt-12 stagger">${rest.slice(0, 3).map(postRow).join('')}</div>
    </section>

    <section class="section">
      <blockquote class="quote">
        <p>${esc(AGENCY.founder.quote)}</p>
        <div class="who"><b>${esc(AGENCY.founder.name)}</b>, ${esc(AGENCY.founder.role)}</div>
      </blockquote>
      <div class="wrap mt-16"><a class="btn btn-tinted btn-block" href="#/about">Об агентстве</a></div>
    </section>`,
  };
}
