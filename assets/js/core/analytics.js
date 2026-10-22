// Демонстрационная аналитика. Персональные данные в события НЕ попадают:
// любые поля из BLOCKED вырезаются перед записью.

import { APP } from '../config/app.js';

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
};

export function track(event, props = {}) {
  const entry = { event, ts: new Date().toISOString(), ...sanitize(props) };
  buffer.push(entry);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(entry);

  if (APP.analytics.debug) console.info('[analytics]', event, entry);

  // Пример подключения Яндекс Метрики (цели):
  if (APP.analytics.yandexMetrikaId && typeof window.ym === 'function') {
    window.ym(APP.analytics.yandexMetrikaId, 'reachGoal', event, sanitize(props));
  }
}

export const getEvents = () => buffer.slice();
