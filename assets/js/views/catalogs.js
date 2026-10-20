import { CATALOGS } from '../config/catalogs.js';
import { OBJECTS } from '../config/objects.js';
import { esc, icon } from '../core/ui.js';
import { objectCatalogs, minPrice, fmtMln } from '../core/match.js';
import { track, EVENTS } from '../core/analytics.js';
import { header, photo, coverCard } from './parts.js';

export function catalogs() {
  return {
    tab: 'catalogs',
    html: `
    ${header({ title: 'Каталоги', back: false })}
    <div class="page-head">
      <h1 class="t-title">Каталоги</h1>
      <p class="t-body">Пять подборок OAZIS ESTATE. Читайте прямо здесь или скачайте PDF — без регистрации.</p>
    </div>
    <div class="cat-grid stagger mt-24">${CATALOGS.map(coverCard).join('')}</div>`,
  };
}

export function catalog({ id }) {
  const c = CATALOGS.find((x) => x.id === id);
  if (!c) return notFound();
  const objs = OBJECTS.filter((o) => objectCatalogs(o).includes(id));
  const pages = Array.from({ length: c.pages }, (_, i) => `catalogs/${c.id}/p${String(i + 1).padStart(2, '0')}.jpg`);

  return {
    tab: 'catalogs',
    back: true,
    html: `
    ${header({ title: c.title })}
    <section class="cat-hero">
      ${photo(c.cover, `Обложка каталога «${c.title}»`, { eager: true })}
      <div class="panel glass-dark">
        <div>
          <h1 class="sr-only">${esc(c.title)}</h1>
          <div class="t-h3" style="color:#fff">${c.pages} страниц · ${c.objectsCount} объектов</div>
          <p class="t-small">PDF доступен для скачивания</p>
        </div>
        <button class="circle glass-dark" data-action="pdf" aria-label="Скачать PDF">${icon('download')}</button>
      </div>
    </section>
    <div class="wrap mt-16">
      <p class="t-body">${esc(c.description)}</p>
      <button class="btn btn-primary btn-block mt-16" data-action="scroll-reader">Читать каталог</button>
    </div>

    ${objs.length ? `<section class="section">
      <div class="sec-head"><h2 class="t-h2">Объекты</h2><span class="t-sub">${objs.length}</span></div>
      <div class="rail stagger">${objs.map((o, i) => `<a class="mini" href="#/object/${o.id}" style="--i:${i}">
        ${photo(o.image, '')}
        <div class="t">${esc(o.name)}</div>
        <div class="s">${esc(o.region)} · ${o.prices[id] ? `от ${fmtMln(o.prices[id])}` : minPrice(o) ? `от ${fmtMln(minPrice(o))}` : 'цена по запросу'}</div>
      </a>`).join('')}</div>
    </section>` : ''}

    <section class="section" id="reader-start">
      <div class="reader" id="reader">
        ${pages.map((src, i) => `<div class="pg" style="aspect-ratio:1080/1600"><img data-src="${src}" alt="Каталог «${esc(c.title)}», страница ${i + 1}" decoding="async"></div>`).join('')}
      </div>
    </section>
    <div class="reader-progress glass" id="reader-pct" aria-hidden="true">0%</div>

    <section class="section">
      <a class="feature" href="#/quiz" data-action="quiz-start">
        ${photo('assets/img/objects/sky-breeze.jpg', '')}
        <div class="panel glass-dark">
          <h2 class="t-h2">Не хочется листать всё?</h2>
          <p>Ответьте на пять вопросов — покажем подходящие объекты из всех каталогов.</p>
          <span class="btn btn-white btn-block">Подобрать объект</span>
        </div>
      </a>
    </section>`,

    mount(root, { open }) {
      track(EVENTS.CATALOG_OPEN, { catalog: c.id });
      const imgs = [...root.querySelectorAll('#reader img')];
      const lastPg = imgs[imgs.length - 1]?.parentElement;
      if (lastPg) lastPg.style.aspectRatio = '1080/1200';
      const load = (img) => {
        if (img.src) return;
        img.onload = () => { img.classList.add('loaded'); img.parentElement.style.aspectRatio = ''; };
        img.onerror = () => img.parentElement.classList.add('err');
        img.src = img.dataset.src;
      };
      let io;
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
        }, { rootMargin: '1400px 0px' });
        imgs.forEach((img) => io.observe(img));
      } else imgs.forEach(load);

      const reader = root.querySelector('#reader');
      const pct = document.querySelector('#reader-pct');
      const onScroll = () => {
        const r = reader.getBoundingClientRect();
        const inside = r.top < window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.6;
        const p = Math.max(0, Math.min(1, -r.top / ((r.height - window.innerHeight) || 1)));
        pct.textContent = `${Math.round(p * 100)}%`;
        pct.classList.toggle('on', inside);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      root.querySelector('[data-action="scroll-reader"]').addEventListener('click', () => {
        root.querySelector('#reader-start').scrollIntoView({ behavior: 'smooth' });
      });
      root.querySelector('[data-action="pdf"]').addEventListener('click', () => {
        track(EVENTS.CATALOG_PDF, { catalog: c.id });
        open(new URL(c.pdf, location.href).href);
      });
      return () => { window.removeEventListener('scroll', onScroll); io?.disconnect(); };
    },
  };
}

export function notFound() {
  return {
    back: true,
    html: `${header({ title: '' })}
    <div class="empty">
      <h1 class="t-title">Страница не найдена</h1>
      <p class="t-body mt-8">Возможно, ссылка устарела. На главной есть всё самое важное.</p>
      <a class="btn btn-primary mt-24" href="#/">На главную</a>
    </div>`,
  };
}
