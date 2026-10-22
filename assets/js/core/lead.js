// Заявки. Формирует данные в формате, готовом для Битрикс24 (crm.lead.add),
// и отправляет их на ВАШ серверный прокси. В прототипе endpoint не задан → демо-режим.

import { APP } from '../config/app.js?v=3';
import { QUIZ } from '../config/quiz.js?v=3';
import { tg } from './tg.js?v=3';

// Российские номера приводим к +7XXXXXXXXXX. intl: true — принимаем и зарубежные (номер из Telegram).
export function normalizePhone(raw, { intl = false } = {}) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && (d[0] === '8' || d[0] === '7')) return `+7${d.slice(1)}`;
  if (d.length === 10 && !intl) return `+7${d}`;
  if (intl && d.length >= 8 && d.length <= 15) return `+${d}`;
  return null;
}

const CONTEXT_TITLE = {
  quiz: 'подборка по квизу',
  object: 'запрос по объекту',
  consultation: 'консультация',
  viewing: 'онлайн-показ',
};

function answerLabels(answers) {
  return QUIZ.map((q) => {
    const opt = q.options.find((o) => o.value === answers[q.id]);
    return { id: q.id, question: q.title, value: answers[q.id] ?? null, label: opt?.label ?? '—' };
  });
}

export function buildLead({ name, phone, answers = {}, objectIds = [], context = 'quiz', phoneSource = 'manual', viewing = null }) {
  const createdAt = new Date().toISOString();
  const qa = answerLabels(answers);
  const tgUser = tg.user();

  return {
    // То, что отправим на сервер
    source: APP.lead.source,
    context, // quiz | object | consultation
    createdAt,
    name: name.trim(),
    phone: normalizePhone(phone, { intl: true }),
    phoneSource, // telegram — номер передан из аккаунта Telegram, manual — введён вручную
    viewing, // { date: 'ГГГГ-ММ-ДД', time: 'ЧЧ:ММ', label, timezone } — только для онлайн-показа
    answers: qa,
    objectIds,
    telegram: tgUser ? { id: tgUser.id, username: tgUser.username || null } : null,
    initData: tg.initData(), // сервер проверяет подпись Telegram

    // Подсказка серверу, как разложить поля в Битрикс24
    bitrix: {
      TITLE: `Mini App: ${CONTEXT_TITLE[context] || context}`,
      NAME: name.trim(),
      PHONE: [{ VALUE: normalizePhone(phone, { intl: true }), VALUE_TYPE: 'MOBILE' }],
      SOURCE_ID: 'UC_TG_MINIAPP', // создайте такой источник в Битрикс24
      SOURCE_DESCRIPTION: APP.lead.source,
      COMMENTS: [
        viewing ? `Онлайн-показ: ${viewing.label} (${viewing.timezone}) — подтвердить с клиентом` : null,
        `Телефон: ${phoneSource === 'telegram' ? 'передан из Telegram' : 'введён вручную'}`,
        ...qa.filter((a) => a.value).map((a) => `${a.question} — ${a.label}`),
        objectIds.length ? `Объекты: ${objectIds.join(', ')}` : null,
        `Дата: ${createdAt}`,
      ].filter(Boolean).join('\n'),
    },
  };
}

export async function submitLead(lead) {
  if (!APP.lead.endpoint) {
    // ДЕМО: ничего не отправляем. Имитируем сетевую задержку для честного UX.
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, demo: true };
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), APP.lead.timeoutMs);
  try {
    const res = await fetch(APP.lead.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, demo: false, ...(await res.json().catch(() => ({}))) };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(t);
  }
}
