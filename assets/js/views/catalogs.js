import { CATALOGS } from '../config/catalogs.js?v=12';
import { esc, icon } from '../core/ui.js?v=12';
import { catalogAccess } from '../core/store.js?v=12';
import { track, EVENTS } from '../core/analytics.js?v=12';
import { header, photo, coverCard } from './parts.js?v=12';

export function catalogs() {
  return {
    tab: 'catalogs',
    html: `
    ${header({ title: 'Каталоги', home: true })}
    <div class="page-head">
      <h1 class="t-title">Каталоги</h1>
      <p class="t-body">Нажмите на каталог, чтобы узнать, что внутри. Скачать его можно после короткой заявки.</p>
    </div>
    <div class="cat-grid stagger mt-24">${CATALOGS.map(coverCard).join('')}</div>`,
  };
}

// Страница каталога: обложка, описание и «что внутри». Читать каталог в приложении нельзя —
// только скачать PDF: сразу (если каталог открыт или заявка уже оставлена) или после заявки.
export function catalog({ id }) {
  const c = CATALOGS.find((x) => x.id === id);
  if (!c) return { redirect: '#/catalogs' }; // например, удалённый горнолыжный каталог
  const open = catalogAccess.isOpen(c);

  return {
    tab: 'catalogs',
    back: true,
    html: `
    ${header({ title: c.title })}
    <section class="cat-hero">
      ${photo(c.cover, `Обложка каталога «${c.title}»`, { eager: true })}
      <div class="panel glass-dark" style="grid-template-columns:1fr">
        <div>
          <h1 class="sr-only">${esc(c.title)}</h1>
          <div class="t-h3" style="color:#fff">${c.objectsCount} объектов, ${c.pages} страниц</div>
          <p class="t-small">${open ? 'PDF доступен для скачивания' : 'Доступен после заявки'}</p>
        </div>
      </div>
    </section>
    <div class="wrap mt-16">
      <p class="t-body">${esc(c.description)}</p>
      <ul class="inside">${(c.inside || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${open
        ? `<button class="btn btn-primary btn-block mt-16" data-action="pdf">${icon('download')} Скачать PDF</button>`
        : `<button class="btn btn-primary btn-block mt-16" data-unlock="${c.id}">${icon('download')} Скачать каталог</button>`}
    </div>`,

    mount(root, { open: openLink }) {
      track(EVENTS.CATALOG_OPEN, { catalog: c.id });
      root.querySelector('[data-action="pdf"]')?.addEventListener('click', () => {
        track(EVENTS.CATALOG_PDF, { catalog: c.id });
        openLink(new URL(c.pdf, location.href).href);
      });
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
