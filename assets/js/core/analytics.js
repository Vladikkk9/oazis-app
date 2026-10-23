// Демонстрационная аналитика. Персональные данные в события НЕ попадают:
// любые поля из BLOCKED вырезаются перед записью.

import { APP } from '../config/app.js?v=9';

const BLOCKED = ['name', 'phone', 'email', 'username', 'first_name', 'last_name', 'user', 'initData'];
const buffer = [];

function sanitize(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (BLOCKED.includes(k)) continue;
    if (typeof v === 'string' && /\+?\d[\d\s()-]{8,}/.test(v)) continue; // похоже на телефон
    out[k] = v;
  }
  return out;
}

export const EVENTS = {
  APP_OPEN: 'app_open',
  SECTION_VIEW: 'section_view',
  CATALOG_OPEN: 'catalog_open',
  CATALOG_PDF: 'catalog_pdf_download',
  POST_OPEN: 'post_open',
  QUIZ_START: 'quiz_start',
  QUIZ_STEP: 'quiz_step_complete',
  QUIZ_COMPLETE: 'quiz_complete',
  RESULT_OBJECT_VIEW: 'result_object_view',
  HIDDEN_OFFER_TAP: 'hidden_offer_tap',
  LEAD_FORM_OPEN: 'lead_form_open',
  LEAD_SUBMIT: 'lead_submit',
  CONTACT_TAP: 'contact_tap',
  PROMO_TAP: 'promo_tap',
  VIEWING_OPEN: 'viewing_open',
  CONTACT_SHARE: 'contact_share',
  CATALOG_UNLOCK_OPEN: 'catalog_unlock_open',
};

export function track(event, props = {}) {
  const entry = { event, ts: new Date().toISOString(), ...sanitize(props) };
  buffer.push(entry);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(entry);

  if (APP.analytics.debug) console.info('[analytics]', event, entry);

  const id = APP.analytics.yandexMetrikaId;
  if (id && typeof window.ym === 'function') {
    // Переход между экранами — как просмотр страницы, остальное — как цели (их видно в отчёте «Конверсии»).
    if (event === EVENTS.SECTION_VIEW) window.ym(id, 'hit', location.href, { title: props.section });
    else window.ym(id, 'reachGoal', event, sanitize(props));
  }
}

// Яндекс Метрика: подключается, только если в config/app.js указан номер счётчика.
// Считает визиты и уникальных пользователей, пишет цели, собирает аудитории для ретаргетинга в Директе.
export function initMetrika({ platform = 'web', inTelegram = false } = {}) {
  const id = APP.analytics.yandexMetrikaId;
  if (!id || window.ym) return;
  /* eslint-disable */
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  /* eslint-enable */
  window.ym(id, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: APP.analytics.webvisor !== false,
    trackHash: false, // экраны отправляем сами через 'hit'
    params: { source: inTelegram ? 'telegram_mini_app' : 'browser', platform },
  });
}

export const getEvents = () => buffer.slice();
