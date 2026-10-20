// Нижняя шторка с формой заявки. Используется из результатов квиза, карточки объекта и раздела «Об агентстве».

import { AGENCY } from '../config/agency.js';
import { APP } from '../config/app.js';
import { buildLead, submitLead, normalizePhone } from '../core/lead.js';
import { track, EVENTS } from '../core/analytics.js';
import { tg } from '../core/tg.js';
import { esc, icon, plural } from '../core/ui.js';

const COPY = {
  quiz: (o) => ({
    title: 'Полная подборка',
    text: `Пришлём все подходящие объекты${o.extra ? `, включая ${o.extra} ${plural(o.extra, ['дополнительный', 'дополнительных', 'дополнительных'])},` : ''} с актуальными ценами, свободными лотами и условиями покупки.`,
    button: 'Получить подборку',
  }),
  object: (o) => ({
    title: 'Планировки и цены',
    text: `Пришлём свободные лоты, планировки и актуальную стоимость по объекту «${o.objectName}».`,
    button: 'Запросить',
  }),
  consultation: () => ({
    title: 'Консультация',
    text: 'Менеджер свяжется с вами, ответит на вопросы и поможет сравнить объекты.',
    button: 'Получить консультацию',
  }),
};

let current = null;

function formatPhoneInput(v) {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let s = '+7';
  if (p[0]) s += ` (${p[0]}`;
  if (p[0].length === 3) s += ')';
  if (p[1]) s += ` ${p[1]}`;
  if (p[2]) s += `-${p[2]}`;
  if (p[3]) s += `-${p[3]}`;
  return s;
}

export function closeLeadSheet() {
  if (!current) return;
  const el = current;
  current = null;
  el.classList.add('closing');
  setTimeout(() => el.remove(), 220);
  document.body.style.overflow = '';
}

export function openLeadSheet(opts) {
  closeLeadSheet();
  const copy = COPY[opts.context](opts);
  const root = document.createElement('div');
  root.className = 'sheet-root';
  root.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lead-title">
      <div class="grabber" aria-hidden="true"></div>
      <div class="head">
        <h2 class="t-h2" id="lead-title">${esc(copy.title)}</h2>
        <button class="circle" data-close aria-label="Закрыть">${icon('close')}</button>
      </div>
      <form novalidate>
        <p class="t-sub" style="margin:6px 0 4px">${esc(copy.text)}</p>
        <div class="field" data-f="name">
          <label for="f-name">Имя</label>
          <input id="f-name" name="name" autocomplete="given-name" enterkeyhint="next" maxlength="60" placeholder="Как к вам обращаться">
          <div class="err" aria-live="polite"></div>
        </div>
        <div class="field" data-f="phone">
          <label for="f-phone">Телефон</label>
          <input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="done" placeholder="+7 (___) ___-__-__">
          <div class="err" aria-live="polite"></div>
        </div>
        <label class="check"><input type="checkbox" name="consent"><span>Согласен на обработку персональных данных в соответствии с <a href="#" data-policy>политикой конфиденциальности</a></span></label>
        <div class="form-error" hidden></div>
        <button class="btn btn-primary btn-block mt-16" type="submit">${esc(copy.button)}</button>
        <button class="btn btn-plain btn-block mt-8" type="button" data-tg>Написать в Telegram</button>
      </form>
    </div>`;
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';
  current = root;

  const form = root.querySelector('form');
  const nameI = form.querySelector('#f-name');
  const phoneI = form.querySelector('#f-phone');
  const setErr = (f, msg) => {
    const box = form.querySelector(`[data-f="${f}"]`);
    box.classList.toggle('invalid', Boolean(msg));
    box.querySelector('.err').textContent = msg || '';
    box.querySelector('input').setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  // Подставим имя из Telegram, если оно доступно (только локально, в поле формы).
  const u = tg.user();
  if (u?.first_name) nameI.value = u.first_name;

  phoneI.addEventListener('focus', () => { if (!phoneI.value) phoneI.value = '+7 '; });
  phoneI.addEventListener('input', () => { phoneI.value = formatPhoneInput(phoneI.value); setErr('phone'); });
  nameI.addEventListener('input', () => setErr('name'));

  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeLeadSheet));
  root.querySelector('[data-tg]').addEventListener('click', () => {
    track(EVENTS.CONTACT_TAP, { channel: 'manager', from: 'lead_sheet' });
    tg.open(AGENCY.contacts.manager);
  });
  root.querySelector('[data-policy]').addEventListener('click', (e) => { e.preventDefault(); tg.open(AGENCY.contacts.policy); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLeadSheet(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameI.value.trim();
    const phone = normalizePhone(phoneI.value);
    let ok = true;
    if (name.length < 2) { setErr('name', 'Введите имя — хотя бы 2 буквы'); ok = false; }
    if (!phone) { setErr('phone', 'Проверьте номер: нужно 10 цифр после +7'); ok = false; }
    if (!form.consent.checked) { ok = false; showFormError('Нужно согласие на обработку данных'); }
    if (!ok) { tg.haptic('error'); (name.length < 2 ? nameI : phoneI).focus(); return; }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Отправляем…';
    form.querySelector('.form-error').hidden = true;

    const lead = buildLead({ name, phone, answers: opts.answers, objectIds: opts.objectIds, context: opts.context });
    const res = await submitLead(lead);
    track(EVENTS.LEAD_SUBMIT, { context: opts.context, demo: res.demo ?? false, ok: res.ok, objects: opts.objectIds?.length || 0 });

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = copy.button;
      tg.haptic('error');
      showFormError('Не получилось отправить. Проверьте интернет и попробуйте ещё раз — или напишите менеджеру в Telegram.');
      return;
    }
    tg.haptic('success');
    renderSuccess(root, res, lead);
  });

  function showFormError(msg) {
    const box = form.querySelector('.form-error');
    box.textContent = msg;
    box.hidden = false;
  }

  setTimeout(() => (nameI.value ? phoneI : nameI).focus({ preventScroll: true }), 360);
}

function renderSuccess(root, res, lead) {
  const preview = { ...lead };
  delete preview.initData;
  const sheet = root.querySelector('.sheet');
  sheet.innerHTML = `
    <div class="grabber" aria-hidden="true"></div>
    <div class="success">
      <div class="mark">${icon('check')}</div>
      <h2 class="t-h2">${res.demo ? 'Заявка сформирована' : 'Заявка отправлена'}</h2>
      <p class="t-sub" style="margin:8px 0 0">${res.demo
        ? 'Так будет выглядеть подтверждение после подключения CRM.'
        : 'Менеджер OAZIS ESTATE свяжется с вами в ближайшее рабочее время.'}</p>
      ${res.demo ? `<div class="demo-note"><span><b>Демо-режим.</b> Данные никуда не отправлены: интеграция с Битрикс24 ещё не подключена. Чтобы связаться с нами сейчас, напишите менеджеру в Telegram.</span></div>
      <details class="payload"><summary>Что уйдёт в CRM после подключения</summary><pre>${esc(JSON.stringify(preview, null, 2))}</pre></details>` : ''}
      <div style="display:grid;gap:10px;margin-top:18px">
        <button class="btn btn-primary btn-block" data-tg>Написать менеджеру</button>
        <button class="btn btn-tinted btn-block" data-close>Вернуться</button>
      </div>
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeLeadSheet);
  sheet.querySelector('[data-tg]').addEventListener('click', () => {
    track(EVENTS.CONTACT_TAP, { channel: 'manager', from: 'lead_success' });
    tg.open(AGENCY.contacts.manager);
  });
}

export const leadEndpointConfigured = () => Boolean(APP.lead.endpoint);
