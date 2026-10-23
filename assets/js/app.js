import { tg } from './core/tg.js?v=6';
import { track, EVENTS, initMetrika } from './core/analytics.js?v=6';
import { icon, toast } from './core/ui.js?v=6';
import { store } from './core/store.js?v=6';
import { home } from './views/home.js?v=6';
import { catalogs, catalog, notFound } from './views/catalogs.js?v=6';
import { read } from './views/read.js?v=6';
import { about } from './views/about.js?v=6';
import { quizStep, matching, results, objectView, firstUnanswered } from './views/quiz.js?v=6';
import { openLeadSheet, closeLeadSheet } from './views/lead.js?v=6';
import { POSTS } from './config/posts.js?v=6';
import { OBJECTS } from './config/objects.js?v=6';
import { CATALOGS } from './config/catalogs.js?v=6';

const ROUTES = [
  [/^\/?$/, home, 'home'],
  [/^\/catalogs$/, catalogs, 'catalogs'],
  [/^\/catalog\/([\w-]+)$/, catalog, 'catalog', ['id']],
  [/^\/read$/, read, 'read'],
  [/^\/about$/, about, 'about'],
  [/^\/quiz$/, () => ({ redirect: quizEntry() }), 'quiz'],
  [/^\/quiz\/(\d)$/, quizStep, 'quiz_step', ['step']],
  [/^\/matching$/, matching, 'matching'],
  [/^\/results$/, results, 'results'],
  [/^\/object\/([\w-]+)$/, objectView, 'object', ['id']],
];
const ROOT_TABS = ['home', 'catalogs', 'read', 'about'];

const app = document.getElementById('app');
const stack = [];
let cleanup = null;
let replacing = false;
const scrollMemory = new Map();

function quizEntry() {
  const fu = firstUnanswered();
  return fu ? `#/quiz/${fu}` : '#/results';
}

function parse(hash) {
  // Telegram при запуске кладёт в адрес служебные параметры (#tgWebAppData=…) — это главная.
  if (/tgWebApp/.test(hash || '')) hash = '#/';
  const path = (hash || '#/').replace(/^#/, '').split('?')[0] || '/';
  for (const [re, view, name, keys = []] of ROUTES) {
    const m = path.match(re);
    if (m) return { view, name, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return { view: notFound, name: 'not_found', params: {} };
}

export function go(hash, { replace = false } = {}) {
  if (replace) {
    replacing = true;
    location.replace(hash);
  } else {
    location.hash = hash;
  }
}

function goBack() {
  if (document.querySelector('.sheet-root')) return closeLeadSheet();
  if (stack.length > 1) history.back();
  else go('#/', { replace: true });
}

const TAB_ORDER = ['home', 'catalogs', 'read', 'about'];

function renderNav(tab, hidden) {
  let bar = document.querySelector('.tabbar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', 'Основная навигация');
    bar.innerHTML = `
      <div class="tabs glass">
        <span class="bubble" aria-hidden="true"></span>
        <a href="#/" data-tab="home">${icon('home')}<span>Главная</span></a>
        <a href="#/catalogs" data-tab="catalogs">${icon('book')}<span>Каталоги</span></a>
        <a href="#/read" data-tab="read">${icon('read')}<span>Читать</span></a>
        <a href="#/about" data-tab="about">${icon('info')}<span>Агентство</span></a>
      </div>
      <a class="fab" href="#/quiz" data-action="quiz-start" aria-label="Подбор недвижимости">${icon('sparkle')}</a>`;
    document.body.appendChild(bar);
  }
  const idx = TAB_ORDER.indexOf(tab);
  bar.querySelectorAll('.tabs a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const bubble = bar.querySelector('.bubble');
  bubble.style.opacity = idx === -1 ? '0' : '1';
  if (idx > -1) bubble.style.transform = `translateX(${idx * 100}%)`;
  bar.classList.toggle('hidden', hidden);
}

// Шапка становится стеклянной, когда контент уходит под неё.
function syncHeader() {
  const h = document.querySelector('[data-header]');
  if (h) h.classList.toggle('scrolled', window.scrollY > 120);
}

// Фото: проявляем после загрузки (событие load не всплывает — ловим на захвате).
document.addEventListener('load', (e) => {
  const ph = e.target.closest?.('.ph');
  if (ph) ph.classList.add('ready');
}, true);
document.addEventListener('error', (e) => {
  const ph = e.target.closest?.('.ph');
  if (ph) ph.classList.add('ready');
}, true);
function markLoaded(root) {
  root.querySelectorAll('.ph img').forEach((img) => { if (img.complete) img.closest('.ph').classList.add('ready'); });
}

function render() {
  const hash = location.hash || '#/';

  // Наш собственный стек — чтобы понимать, есть ли куда возвращаться.
  if (replacing) { stack[stack.length - 1] = hash; replacing = false; }
  else if (stack.length > 1 && stack[stack.length - 2] === hash) stack.pop();
  else if (stack[stack.length - 1] !== hash) stack.push(hash);

  const { view, name, params } = parse(hash);
  let v;
  try {
    v = view(params) || {};
  } catch (e) {
    console.error(e);
    v = { html: `<div class="empty"><h1 class="t-title">Что-то пошло не так</h1><p class="t-body mt-8">Попробуйте обновить страницу.</p><a class="btn btn-primary mt-16" href="#/">На главную</a></div>` };
  }
  if (v.redirect) return go(v.redirect, { replace: true });

  cleanup?.();
  cleanup = null;
  closeLeadSheet();

  const prevY = scrollMemory.get(hash);
  app.innerHTML = `<main class="view ${v.cls || ''} ${v.hideNav ? 'no-nav' : ''}" data-route="${name}">${v.html}</main>`;
  window.scrollTo(0, prevY && name !== 'quiz_step' ? prevY : 0);

  renderNav(v.tab, Boolean(v.hideNav));
  // Системная кнопка Telegram «Назад»: на вкладках ведёт на главную, на внутренних экранах — на шаг назад.
  tg.backButton(name !== 'home', ROOT_TABS.includes(name) ? () => go('#/') : goBack);

  const root = app.firstElementChild;
  markLoaded(root);
  syncHeader();
  if (v.mount) cleanup = v.mount(root, { go, open: tg.open.bind(tg) }) || null;

  track(EVENTS.SECTION_VIEW, { section: name, ...(params.id ? { id: params.id } : {}) });
}

// Глобальное делегирование кликов
document.addEventListener('click', (e) => {
  const vb = e.target.closest('[data-viewing]');
  if (vb) {
    e.preventDefault();
    const o = OBJECTS.find((x) => x.id === vb.dataset.viewing);
    if (o) {
      track(EVENTS.VIEWING_OPEN, { object: o.id, from: document.querySelector('main')?.dataset.route });
      openLeadSheet({ context: 'viewing', answers: store.answers, objectIds: [o.id] });
    }
    return;
  }
  const ub = e.target.closest('[data-unlock]');
  if (ub) {
    e.preventDefault();
    const c = CATALOGS.find((x) => x.id === ub.dataset.unlock);
    if (c) {
      track(EVENTS.CATALOG_UNLOCK_OPEN, { catalog: c.id });
      openLeadSheet({ context: 'catalog', catalogId: c.id, catalogTitle: c.title, answers: store.answers, objectIds: [] });
    }
    return;
  }
  const promo = e.target.closest('[data-promo]');
  if (promo) track(EVENTS.PROMO_TAP, { promo: promo.dataset.promo });
  const el = e.target.closest('[data-open], [data-post], [data-action]');
  if (!el) return;

  if (el.dataset.post) {
    e.preventDefault();
    track(EVENTS.POST_OPEN, { post: Number(el.dataset.post) });
    tg.open(el.dataset.url);
    return;
  }
  if (el.dataset.open) {
    e.preventDefault();
    if (el.dataset.contact) track(EVENTS.CONTACT_TAP, { channel: el.dataset.contact });
    tg.open(el.dataset.open);
    return;
  }
  switch (el.dataset.action) {
    case 'back':
      e.preventDefault();
      goBack();
      break;
    case 'quiz-start':
      e.preventDefault();
      tg.haptic('light');
      store.editing = false;
      go(quizEntry());
      break;
    case 'consult':
      e.preventDefault();
      track(EVENTS.LEAD_FORM_OPEN, { from: 'about' });
      openLeadSheet({ context: 'consultation', answers: store.answers, objectIds: [] });
      break;
    default:
  }
});

window.addEventListener('scroll', () => { scrollMemory.set(location.hash || '#/', window.scrollY); syncHeader(); }, { passive: true });
window.addEventListener('hashchange', render);
window.addEventListener('offline', () => toast('Нет соединения — часть изображений может не загрузиться'));

// Deep links: t.me/<bot>/<app>?startapp=quiz | catalog_altai | object_rizalta | read
function startRoute() {
  const p = tg.startParam();
  if (!p) return null;
  if (p === 'quiz') return '#/quiz';
  if (p === 'read') return '#/read';
  if (p === 'about') return '#/about';
  const [kind, id] = p.split(/_(.+)/);
  if (kind === 'catalog' && id) return `#/catalog/${id}`;
  if (kind === 'object' && id) return `#/object/${id}`;
  if (kind === 'post' && POSTS.some((x) => String(x.id) === id)) return '#/read';
  return null;
}

// telegram-web-app.js уже прочитал параметры запуска из адреса — убираем их, чтобы не мешали навигации.
if (/tgWebApp/.test(location.hash)) history.replaceState(null, '', `${location.pathname}${location.search}#/`);

tg.init();
initMetrika({ platform: tg.raw?.platform || 'web', inTelegram: tg.inside });
track(EVENTS.APP_OPEN, { inTelegram: tg.inside, platform: tg.raw?.platform || 'web' });
const start = startRoute();
if (start && (!location.hash || location.hash === '#/')) {
  stack.push('#/');
  location.hash = start;
} else {
  render();
}
