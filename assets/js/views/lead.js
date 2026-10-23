// Шторка заявки: подборка, запрос по объекту, консультация и онлайн-показ.
// В Telegram главный путь — «Отправить с номером из Telegram» (одно нажатие),
// ручной ввод остаётся запасным. В обычном браузере — классическая форма.

import { AGENCY } from '../config/agency.js?v=4';
import { APP } from '../config/app.js?v=4';
import { buildLead, submitLead, normalizePhone } from '../core/lead.js?v=4';
import { track, EVENTS } from '../core/analytics.js?v=4';
import { tg } from '../core/tg.js?v=4';
import { esc, icon, plural } from '../core/ui.js?v=4';

const COPY = {
  quiz: (o) => ({
    title: 'Полная подборка',
    text: `Пришлём все подходящие объекты${o.extra ? `, включая ${o.extra} ${plural(o.extra, ['дополнительный', 'дополнительных', 'дополнительных'])},` : ''} с актуальными ценами и условиями.`,
    button: 'Получить подборку',
  }),
  object: (o) => ({
    title: 'Планировки и цены',
    text: 'Пришлём свободные лоты, планировки и актуальные цены по этому объекту.',
    button: 'Запросить',
  }),
  consultation: () => ({
    title: 'Консультация',
    text: 'Менеджер ответит на вопросы и поможет сравнить объекты.',
    button: 'Получить консультацию',
  }),
  viewing: (o) => ({
    title: 'Онлайн-показ',
    text: 'Менеджер покажет территорию и планировки по видеосвязи и ответит на вопросы.',
    button: 'Записаться на показ',
  }),
};

let current = null;

// ---------- Слоты онлайн-показа ----------

// Текущие дата и время в часовом поясе агентства.
function nowIn(tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function viewingDays() {
  const v = APP.viewing;
  const now = nowIn(v.timezone);
  const base = new Date(`${now.date}T12:00:00Z`);
  const days = [];
  for (let i = 0; i < v.daysAhead + 7 && days.length < v.daysAhead; i += 1) {
    const d = new Date(base.getTime() + i * 864e5);
    const iso = d.toISOString().slice(0, 10);
    const wd = d.getUTCDay() || 7;
    if (!v.weekdays.includes(wd)) continue;
    const slots = v.slots.filter((s) => i > 0 || toMinutes(s) - now.minutes >= v.minLeadMinutes);
    if (!slots.length) continue;
    const label = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : d.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' });
    const sub = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '');
    const full = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    days.push({ iso, label, sub, full, slots });
  }
  return days;
}

// ---------- Маска телефона ----------

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
  const quick = tg.canRequestContact();
  const isViewing = opts.context === 'viewing';
  const days = isViewing ? viewingDays() : [];
  const state = { day: days[0] || null, time: null, manual: !quick };

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

        ${isViewing ? `
        <div class="pick">
          <div class="pick-label">День</div>
          <div class="days" role="radiogroup" aria-label="День показа">${days.map((d, i) => `
            <button type="button" class="day" role="radio" aria-checked="${i === 0}" data-day="${d.iso}">
              <b>${esc(d.label)}</b><span>${esc(d.sub)}</span>
            </button>`).join('')}</div>
          <div class="pick-label">Время, ${esc(APP.viewing.timezoneLabel)}</div>
          <div class="slots" role="radiogroup" aria-label="Время показа"></div>
          <div class="err" data-slot-err aria-live="polite"></div>
          <p class="t-small">Менеджер подтвердит время в Telegram или по телефону.</p>
        </div>` : ''}

        <div class="manual" ${state.manual ? '' : 'hidden'}>
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
        </div>

        <label class="check"><input type="checkbox" name="consent"><span>Согласен на обработку персональных данных в соответствии с <a href="#" data-policy>политикой конфиденциальности</a></span></label>
        <div class="form-error" hidden></div>

        ${quick ? `
        <div class="quick" ${state.manual ? 'hidden' : ''}>
          <button class="btn btn-primary btn-block mt-16" type="button" data-share>${icon('telegram')} ${esc(copy.button)}</button>
          <p class="t-small center mt-8">Номер возьмём из Telegram — вводить ничего не нужно</p>
          <button class="btn btn-plain btn-block" type="button" data-manual>Ввести другой номер</button>
        </div>` : ''}
        <button class="btn btn-primary btn-block mt-16" type="submit" ${state.manual ? '' : 'hidden'}>${esc(copy.button)}</button>
        <button class="btn btn-plain btn-block mt-8" type="button" data-tg>Написать менеджеру в Telegram</button>
      </form>
    </div>`;
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';
  current = root;

  const form = root.querySelector('form');
  const nameI = form.querySelector('#f-name');
  const phoneI = form.querySelector('#f-phone');
  const submitBtn = form.querySelector('[type="submit"]');
  const u = tg.user();
  if (u?.first_name) nameI.value = u.first_name;

  const setErr = (f, msg) => {
    const box = form.querySelector(`[data-f="${f}"]`);
    box.classList.toggle('invalid', Boolean(msg));
    box.querySelector('.err').textContent = msg || '';
    box.querySelector('input').setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const showFormError = (msg) => {
    const box = form.querySelector('.form-error');
    box.textContent = msg || '';
    box.hidden = !msg;
  };

  // ----- Выбор дня и времени -----
  const slotsBox = form.querySelector('.slots');
  const renderSlots = () => {
    if (!slotsBox) return;
    slotsBox.innerHTML = state.day.slots
      .map((s) => `<button type="button" class="slot" role="radio" aria-checked="${state.time === s}" data-slot="${s}">${s}</button>`)
      .join('');
  };
  if (isViewing) {
    if (!days.length) {
      form.querySelector('.pick').innerHTML = '<p class="t-small">Свободное время уточнит менеджер — оставьте контакт.</p>';
    } else {
      renderSlots();
      form.querySelector('.days').addEventListener('click', (e) => {
        const b = e.target.closest('[data-day]');
        if (!b) return;
        state.day = days.find((d) => d.iso === b.dataset.day);
        if (!state.day.slots.includes(state.time)) state.time = null;
        form.querySelectorAll('.day').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        renderSlots();
        tg.haptic('select');
      });
      slotsBox.addEventListener('click', (e) => {
        const b = e.target.closest('[data-slot]');
        if (!b) return;
        state.time = b.dataset.slot;
        slotsBox.querySelectorAll('.slot').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        form.querySelector('[data-slot-err]').textContent = '';
        tg.haptic('select');
      });
    }
  }

  const viewingValue = () =>
    isViewing && state.day && state.time
      ? { date: state.day.iso, time: state.time, label: `${state.day.full}, ${state.time}`, timezone: APP.viewing.timezone }
      : null;

  // Общие проверки перед отправкой: время показа и согласие.
  const precheck = () => {
    showFormError('');
    if (isViewing && days.length && !state.time) {
      form.querySelector('[data-slot-err]').textContent = 'Выберите удобное время';
      return false;
    }
    if (!form.consent.checked) {
      showFormError('Отметьте согласие на обработку данных');
      return false;
    }
    return true;
  };

  async function send({ name, phone, phoneSource, busyBtn, label }) {
    busyBtn.disabled = true;
    busyBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Отправляем…';
    const lead = buildLead({
      name, phone, phoneSource,
      answers: opts.answers, objectIds: opts.objectIds, context: opts.context, viewing: viewingValue(),
    });
    const res = await submitLead(lead);
    track(EVENTS.LEAD_SUBMIT, { context: opts.context, demo: res.demo ?? false, ok: res.ok, objects: opts.objectIds?.length || 0, phoneSource });
    if (!res.ok) {
      busyBtn.disabled = false;
      busyBtn.innerHTML = label;
      tg.haptic('error');
      showFormError('Не получилось отправить. Проверьте интернет и попробуйте ещё раз — или напишите менеджеру в Telegram.');
      return;
    }
    tg.haptic('success');
    renderSuccess(root, res, lead);
  }

  // ----- Номер в одно нажатие -----
  const shareBtn = form.querySelector('[data-share]');
  const showManual = () => {
    state.manual = true;
    form.querySelector('.manual').hidden = false;
    form.querySelector('.quick').hidden = true;
    submitBtn.hidden = false;
    setTimeout(() => (nameI.value ? phoneI : nameI).focus(), 50);
  };
  shareBtn?.addEventListener('click', async () => {
    if (!precheck()) { tg.haptic('error'); return; }
    const label = shareBtn.innerHTML;
    const contact = await tg.requestContact();
    track(EVENTS.CONTACT_SHARE, { shared: Boolean(contact), context: opts.context });
    const phone = contact && normalizePhone(contact.phone, { intl: true });
    if (!phone) {
      showManual();
      showFormError('Номер не передан — введите его вручную, это займёт пару секунд.');
      return;
    }
    const name = (u?.first_name || contact.firstName || 'Клиент из Telegram').trim();
    send({ name, phone, phoneSource: 'telegram', busyBtn: shareBtn, label });
  });
  form.querySelector('[data-manual]')?.addEventListener('click', showManual);

  // ----- Ручной ввод -----
  phoneI.addEventListener('focus', () => { if (!phoneI.value) phoneI.value = '+7 '; });
  phoneI.addEventListener('input', () => { phoneI.value = formatPhoneInput(phoneI.value); setErr('phone'); });
  nameI.addEventListener('input', () => setErr('name'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.manual) return;
    const name = nameI.value.trim();
    const phone = normalizePhone(phoneI.value);
    let ok = true;
    if (name.length < 2) { setErr('name', 'Введите имя — хотя бы 2 буквы'); ok = false; }
    if (!phone) { setErr('phone', 'Проверьте номер: нужно 10 цифр после +7'); ok = false; }
    if (!precheck()) ok = false;
    if (!ok) { tg.haptic('error'); return; }
    send({ name, phone, phoneSource: 'manual', busyBtn: submitBtn, label: esc(copy.button) });
  });

  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeLeadSheet));
  root.querySelector('[data-tg]').addEventListener('click', () => {
    track(EVENTS.CONTACT_TAP, { channel: 'manager', from: 'lead_sheet' });
    tg.open(AGENCY.contacts.manager);
  });
  root.querySelector('[data-policy]').addEventListener('click', (e) => { e.preventDefault(); tg.open(AGENCY.contacts.policy); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLeadSheet(); });

  if (state.manual && !isViewing) setTimeout(() => (nameI.value ? phoneI : nameI).focus({ preventScroll: true }), 360);
}

function renderSuccess(root, res, lead) {
  const preview = { ...lead };
  delete preview.initData;
  const v = lead.viewing;
  const title = v ? (res.demo ? 'Запись на показ сформирована' : 'Вы записаны на показ') : res.demo ? 'Заявка сформирована' : 'Заявка отправлена';
  const sub = v
    ? `${v.label} по Москве. Менеджер подтвердит время и пришлёт ссылку.`
    : res.demo ? 'Так будет выглядеть подтверждение после подключения CRM.' : 'Менеджер свяжется с вами в рабочее время.';
  const sheet = root.querySelector('.sheet');
  sheet.innerHTML = `
    <div class="grabber" aria-hidden="true"></div>
    <div class="success">
      <div class="mark">${icon(v ? 'video' : 'check')}</div>
      <h2 class="t-h2">${title}</h2>
      <p class="t-sub" style="margin:8px 0 0">${esc(sub)}</p>
      ${res.demo ? `<div class="demo-note"><span><b>Демо-режим:</b> заявка не отправлена, CRM ещё не подключена. Чтобы связаться сейчас, напишите менеджеру.</span></div>
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
