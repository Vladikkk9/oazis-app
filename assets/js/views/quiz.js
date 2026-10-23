import { QUIZ } from '../config/quiz.js?v=7';
import { OBJECTS, CATALOG_NAMES } from '../config/objects.js?v=7';
import { store } from '../core/store.js?v=7';
import { esc, icon, plural, scroller } from '../core/ui.js?v=7';
import { tg } from '../core/tg.js?v=7';
import { track, EVENTS } from '../core/analytics.js?v=7';
import { match, TYPE_LABEL, priceSources, fmtMln, objectCatalogs, minPrice } from '../core/match.js?v=7';
import { objectCard, fineprint, header, photo, priceText } from './parts.js?v=7';
import { openLeadSheet } from './lead.js?v=7';
import { notFound } from './catalogs.js?v=7';
import { CATALOGS } from '../config/catalogs.js?v=7';
import { promoFor } from '../config/promos.js?v=7';

// Фон квиза меняется от шага к шагу — живая подложка для стеклянных вариантов ответа.
const QUIZ_BG = ['palazzo', 'leeprime', 'kp540', 'volna', 'kedry'];

const visibleQuestions = (answers) => QUIZ.filter((q) => !q.showIf || q.showIf(answers));

export function firstUnanswered() {
  const a = store.answers;
  const i = visibleQuestions(a).findIndex((q) => !a[q.id]);
  return i === -1 ? null : i + 1;
}

let lastStep = 0;

export function quizStep({ step }) {
  const answers = store.answers;
  const qs = visibleQuestions(answers);
  const n = Math.max(1, Math.min(qs.length, parseInt(step, 10) || 1));
  const fu = firstUnanswered();
  if (!store.editing && fu && n > fu) return { redirect: `#/quiz/${fu}` };

  const q = qs[n - 1];
  const value = answers[q.id];
  const dir = n < lastStep ? 'back' : '';
  lastStep = n;
  const isLast = n === qs.length;
  const grid = q.id === 'rooms';
  const editing = store.editing;

  const optHtml = q.options
    .map((o, i) => {
      const checked = value === o.value;
      if (grid) {
        return `<button class="opt big glass" role="radio" aria-checked="${checked}" data-value="${o.value}" style="--i:${i}">
          <span class="radio">${icon('check')}</span>
          <span class="num">${o.short ? esc(o.short) : icon(o.icon)}</span><span class="lbl">${esc(o.label)}</span>
        </button>`;
      }
      return `<button class="opt glass" role="radio" aria-checked="${checked}" data-value="${o.value}" style="--i:${i}">
        ${o.icon ? `<span class="oi">${icon(o.icon)}</span>` : ''}
        <span class="lbl">${esc(o.label)}</span>
        <span class="radio">${icon('check')}</span>
      </button>`;
    })
    .join('');

  return {
    hideNav: true,
    back: true,
    cls: 'quiz',
    html: `
    <div class="quiz-bg" aria-hidden="true"><img src="assets/img/objects/${QUIZ_BG[n - 1] || QUIZ_BG[0]}.jpg" alt=""></div>
    <div class="quiz-top">
      <button class="circle glass" data-action="quiz-exit" aria-label="Выйти из подбора">${icon('close')}</button>
      <div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="${qs.length}" aria-valuenow="${n}"><i style="width:${((n - (value ? 0 : 1)) / qs.length) * 100}%"></i></div>
      <div class="count">${n}/${qs.length}</div>
    </div>
    <div class="quiz-body q-anim ${dir}">
      <h1 class="t-title" id="q-title">${esc(q.title)}</h1>
      <div class="options ${grid ? 'grid2' : ''} stagger" role="radiogroup" aria-labelledby="q-title">${optHtml}</div>
      ${n === 1 && !editing ? '<p class="hint">Без регистрации. Подходящие объекты покажем сразу после ответов.</p>' : ''}
    </div>
    <div class="quiz-foot">
      ${n > 1 && !editing ? `<a class="circle glass" href="#/quiz/${n - 1}" aria-label="Предыдущий вопрос">${icon('arrowL')}</a>` : '<span></span>'}
      <button class="btn btn-primary" data-action="next" ${value ? '' : 'disabled'}>${editing ? 'Сохранить' : isLast ? 'Показать подборку' : 'Далее'}</button>
    </div>`,

    mount(root, { go }) {
      if (n === 1 && !value) track(EVENTS.QUIZ_START);
      const bar = root.querySelector('.bar i');
      const next = () => {
        const v = store.answers[q.id];
        if (!v) return;
        track(EVENTS.QUIZ_STEP, { step: n, question: q.id, answer: v });
        if (store.editing) {
          store.editing = false;
          return go('#/results', { replace: true });
        }
        if (isLast) {
          track(EVENTS.QUIZ_COMPLETE, { ...store.answers });
          return go('#/matching', { replace: true });
        }
        go(`#/quiz/${n + 1}`);
      };
      let timer;
      root.querySelectorAll('.opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          root.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-checked', 'false'));
          btn.setAttribute('aria-checked', 'true');
          store.setAnswer(q.id, btn.dataset.value);
          root.querySelector('[data-action="next"]').disabled = false;
          bar.style.width = `${(n / qs.length) * 100}%`;
          tg.haptic('select');
          clearTimeout(timer);
          if (!store.editing) timer = setTimeout(next, 360);
        });
      });
      root.querySelector('[data-action="next"]').addEventListener('click', () => { clearTimeout(timer); next(); });
      root.querySelector('[data-action="quiz-exit"]').addEventListener('click', () => {
        store.editing = false;
        go(firstUnanswered() === null ? '#/results' : '#/');
      });
      return () => clearTimeout(timer);
    },
  };
}

export function matching() {
  if (firstUnanswered()) return { redirect: `#/quiz/${firstUnanswered()}` };
  const steps = ['Сверяем формат и цель', 'Смотрим каталоги OAZIS', 'Проверяем бюджет и условия'];
  return {
    hideNav: true,
    html: `<div class="matching" role="status" aria-live="polite"><div>
      <div class="orb glass"></div>
      <h1 class="t-title">Подбираем объекты</h1>
      <ul>${steps.map((s) => `<li>${s}</li>`).join('')}</ul>
    </div></div>`,
    mount(root, { go }) {
      const lis = root.querySelectorAll('li');
      const timers = [0, 1, 2].map((i) => setTimeout(() => lis[i].classList.add('on'), 250 + i * 380));
      timers.push(setTimeout(() => { tg.haptic('success'); go('#/results', { replace: true }); }, 1500));
      return () => timers.forEach(clearTimeout);
    },
  };
}

function summaryPills(answers) {
  return visibleQuestions(answers)
    .map((q, i) => {
      const o = q.options.find((x) => x.value === answers[q.id]);
      const text = q.id === 'rooms' ? (o.value === 'studio' ? 'Студия' : `${o.short} комн.`) : o.label;
      return `<button class="pill" data-edit="${i + 1}" aria-label="Изменить: ${esc(q.title)}">${esc(text)} ${icon('edit')}</button>`;
    })
    .join('');
}

const TYPE_GEN = { flat: 'квартир', apartments: 'апартаментов', house: 'домов и таунхаусов', commercial: 'коммерческой недвижимости' };

// Короткие тексты — не длиннее трёх строк на экране телефона.
function intro(res, answers) {
  const nOpen = res.open.length;
  const nHidden = res.hidden.length;
  const what = TYPE_GEN[answers.type] || 'объектов';
  if (res.mode === 'exact') {
    const head = `${nOpen} ${plural(nOpen, ['объект подходит', 'объекта подходят', 'объектов подходят'])} под ваши параметры`;
    return `${head}${nHidden ? `. Ещё ${nHidden} стоит сравнить по цене и условиям` : ''}.`;
  }
  if (res.mode === 'near-budget') return `В бюджете «${res.budget.label}» ${what} в каталогах нет. Вот ближайшие по цене варианты.`;
  return `${what[0].toUpperCase()}${what.slice(1)} в каталогах нет — подберём индивидуально. Вот что подходит под вашу цель.`;
}

export function results() {
  if (firstUnanswered()) return { redirect: `#/quiz/${firstUnanswered()}` };
  const answers = store.answers;
  const res = match(answers);
  const extra = res.hidden.length;

  const locked = res.hidden
    .map((h, i) => `<button class="lcard" data-hidden="${h.kind}" style="--i:${i}" aria-label="${esc(h.text)}. Открыть в полной подборке">
      ${photo(h.o.image, '')}
      <span class="lock glass-dark">${icon('lock', 'ic-sm')}</span>
      <div class="panel glass-dark"><b>${esc(h.text)}</b><span>${esc(TYPE_LABEL[h.o.type])}, ${esc(h.o.region)}</span></div>
    </button>`)
    .join('');

  return {
    hideNav: true,
    back: true,
    cls: 'has-cta',
    html: `
    ${header({ title: 'Ваша подборка', right: `<a class="circle glass" href="#/" aria-label="На главную">${icon('home')}</a>` })}
    <div class="page-head">
      <h1 class="t-title">${res.mode === 'exact' ? 'Ваша подборка' : 'Близкие варианты'}</h1>
      <p class="t-body">${intro(res, answers)}</p>
    </div>
    <p class="t-small wrap" style="margin-top:14px">По вашим ответам — нажмите, чтобы изменить</p>
    <div class="answers mt-8" aria-label="Ваши ответы — нажмите, чтобы изменить">${summaryPills(answers)}</div>

    <section class="section" style="margin-top:20px">
      ${res.mode !== 'exact' ? '<div class="note">Это не точное совпадение — в карточке указано, чем вариант отличается от запроса.</div>' : ''}
      <div class="stagger">${res.open.length
        ? res.open.map(({ o, reasons, near }, i) => objectCard(o, reasons, { near, i })).join('')
        : `<div class="wrap"><h2 class="t-h2">Совпадений нет</h2><p class="t-body mt-8">Под такие параметры в каталогах сейчас нет объектов. Менеджер подберёт варианты индивидуально.</p></div>`}</div>
    </section>

    ${extra ? `<section class="section">
      <div class="sec-head"><h2 class="t-h2">Ещё ${extra} ${plural(extra, ['вариант', 'варианта', 'вариантов'])}</h2></div>
      <p class="t-sub wrap" style="margin:-4px 0 14px">Каждый выделяется ценой, локацией, форматом или условиями. Названия и планировки пришлём в полной подборке.</p>
      <div class="locked stagger">${locked}</div>
    </section>` : ''}

    <div class="offer">
      <h2 class="t-h2">Полная подборка</h2>
      <ul>
        <li>Все подходящие объекты${extra ? `, включая ${extra} ${plural(extra, ['дополнительный', 'дополнительных', 'дополнительных'])}` : ''}</li>
        <li>Актуальные цены и свободные лоты</li>
        <li>Условия: ипотека, рассрочка, полная оплата</li>
        <li>Плюсы и минусы каждого проекта</li>
      </ul>
      <button class="btn btn-primary btn-block" data-action="lead">Получить бесплатно</button>
    </div>

    ${fineprint()}
    <div class="wrap mt-12"><button class="btn-plain" data-action="restart">Пройти подбор заново</button></div>

    <div class="sticky-cta glass away" id="sticky"><button class="btn btn-primary btn-block" data-action="lead">Получить полную подборку</button></div>`,

    mount(root, { go }) {
      const ids = [...res.open.map((x) => x.o.id), ...res.hidden.map((x) => x.o.id)];
      const openLead = (src) => {
        track(EVENTS.LEAD_FORM_OPEN, { from: src });
        openLeadSheet({ context: 'quiz', answers, objectIds: ids, extra });
      };
      root.querySelectorAll('[data-action="lead"]').forEach((b) => b.addEventListener('click', () => openLead('results')));
      root.querySelectorAll('[data-hidden]').forEach((b) =>
        b.addEventListener('click', () => {
          track(EVENTS.HIDDEN_OFFER_TAP, { kind: b.dataset.hidden });
          openLead('hidden_offer');
        }));
      root.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => { store.editing = true; go(`#/quiz/${b.dataset.edit}`); }));
      root.querySelector('[data-action="restart"]').addEventListener('click', () => { store.reset(); go('#/quiz/1'); });
      root.querySelectorAll('[data-object-view]').forEach((a) =>
        a.addEventListener('click', () => track(EVENTS.RESULT_OBJECT_VIEW, { object: a.dataset.objectView })));

      const sticky = document.querySelector('#sticky');
      const offer = root.querySelector('.offer');
      const onScroll = () => {
        const r = offer.getBoundingClientRect();
        sticky.classList.toggle('away', scroller().scrollTop < 300 || (r.top < window.innerHeight && r.bottom > 0));
      };
      scroller().addEventListener('scroll', onScroll, { passive: true });
      return () => scroller().removeEventListener('scroll', onScroll);
    },
  };
}

export function objectView({ id }) {
  const o = OBJECTS.find((x) => x.id === id);
  if (!o) return notFound();
  const sources = priceSources(o);
  const cats = objectCatalogs(o).filter((cid) => CATALOGS.some((c) => c.id === cid)); // только каталоги, которые есть в приложении
  const area = o.area?.[0] ? `${o.area[0]}${o.area[1] ? `–${o.area[1]}` : '+'} м²` : '—';
  const promo = promoFor(o.id);
  const CLASS_GEN = { 'Премиум': 'премиум-класса', 'Бизнес': 'бизнес-класса', 'Комфорт': 'комфорт-класса', 'Элит': 'элит-класса' };
  const kicker = [o.type ? TYPE_LABEL[o.type] : o.format, CLASS_GEN[o.class]].filter(Boolean).join(' ');

  return {
    hideNav: true,
    back: true,
    html: `
    ${header({ title: o.alias, right: `<a class="circle glass" href="#/" aria-label="На главную">${icon('home')}</a>` })}
    <div class="d-hero">${photo(o.image, o.alias, { eager: true })}</div>
    <div class="d-sheet">
      <div class="kicker">${esc(kicker)}</div>
      <h1 class="t-title">${esc(o.alias)}</h1>
      <p class="t-sub mt-8">${esc(o.location)}</p>
      <div class="d-price"><b>${priceText(o)}</b>${sources.length > 1 ? '<span>минимальная из каталогов</span>' : ''}</div>

      <dl class="kv">
        <div><dt>Формат</dt><dd>${esc(o.format)}</dd></div>
        <div><dt>Площади</dt><dd>${area}</dd></div>
        <div><dt>${o.ready ? 'Статус' : 'Срок сдачи'}</dt><dd>${esc(o.completion)}</dd></div>
        <div><dt>Локация</dt><dd>${esc(o.highlight.value)} ${esc(o.highlight.label)}</dd></div>
      </dl>

      <p class="d-desc">${esc(o.about)}</p>
      ${promo ? `<div class="promo-box"><b>${esc(promo.title)}</b><p>${esc(promo.text)}</p><div class="src">Источник: ${esc(promo.source)}. Сроки и наличие уточняйте у менеджера.</div></div>` : ''}
      <ul class="feats">${o.perks.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${o.installment ? `<div class="note">${esc(o.installment)}</div>` : ''}

      ${sources.length ? `<h2 class="t-h2" style="margin-top:28px">Цена в каталогах</h2>
      <dl class="kv">${sources.map((s) => `<div><dt>${esc(s.name)}</dt><dd>от ${fmtMln(s.value)}</dd></div>`).join('')}</dl>
      ${sources.length > 1 ? '<div class="note">В каталогах указаны разные цены. Актуальную стоимость конкретного лота уточнит менеджер.</div>' : ''}` : ''}
      ${(o.conflicts || []).map((c) => `<div class="note">${esc(c)} — уточняем у застройщика.</div>`).join('')}

      <div class="mt-24" style="display:grid;gap:10px">
        <button class="btn btn-primary btn-block" data-viewing="${o.id}">${icon('video')} Показать по видеосвязи</button>
        <button class="btn btn-tinted btn-block" data-action="lead">Запросить планировки и цены</button>
        ${cats.map((cid) => `<a class="btn btn-tinted btn-block" href="#/catalog/${cid}">Каталог «${esc(CATALOG_NAMES[cid])}»</a>`).join('')}
      </div>
    </div>
    ${fineprint()}`,
    mount(root) {
      track(EVENTS.RESULT_OBJECT_VIEW, { object: o.id, from: 'detail', price: minPrice(o) });
      root.querySelector('[data-action="lead"]').addEventListener('click', () => {
        track(EVENTS.LEAD_FORM_OPEN, { from: 'object', object: o.id });
        openLeadSheet({ context: 'object', answers: store.answers, objectIds: [o.id] });
      });
    },
  };
}
