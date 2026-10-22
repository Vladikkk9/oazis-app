// ПРИМЕР серверного прокси для заявок → Битрикс24 (Cloudflare Workers, бесплатный тариф).
// Это НЕ часть сайта на GitHub Pages: разворачивается отдельно, секреты хранятся на сервере.
//
// Переменные окружения (Settings → Variables, тип Secret):
//   BOT_TOKEN       — токен бота из BotFather (для проверки подписи Telegram initData)
//   BITRIX_WEBHOOK  — входящий вебхук Битрикс24, например https://<портал>.bitrix24.ru/rest/1/<ключ>/
//   ALLOWED_ORIGIN  — адрес Mini App, например https://<логин>.github.io
//
// После деплоя впишите URL воркера в assets/js/config/app.js → lead.endpoint.

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ ok: false }, 405, cors);

    let lead;
    try {
      lead = await request.json();
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400, cors);
    }

    // 1. Проверяем, что заявка пришла из настоящего Telegram Mini App
    const tgUser = await verifyInitData(lead.initData, env.BOT_TOKEN);
    if (!tgUser) return json({ ok: false, error: 'bad_signature' }, 403, cors);

    // 2. Минимальная валидация
    const name = String(lead.name || '').trim().slice(0, 60);
    const phone = String(lead.phone || '');
    if (name.length < 2 || !/^\+\d{8,15}$/.test(phone)) return json({ ok: false, error: 'invalid' }, 422, cors);

    // 3. Создаём лид в Битрикс24
    const b = lead.bitrix || {};
    const fields = {
      TITLE: String(b.TITLE || 'Заявка из Telegram Mini App').slice(0, 200),
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }],
      SOURCE_ID: b.SOURCE_ID || 'UC_TG_MINIAPP',
      SOURCE_DESCRIPTION: 'Telegram Mini App',
      COMMENTS: [String(b.COMMENTS || '').slice(0, 4000), `Telegram ID: ${tgUser.id}${tgUser.username ? ` (@${tgUser.username})` : ''}`].join('\n'),
      // Пользовательские поля можно добавить так: UF_CRM_QUIZ_BUDGET: ...
    };
    const res = await fetch(`${env.BITRIX_WEBHOOK}crm.lead.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.result) return json({ ok: false, error: 'crm' }, 502, cors);
    return json({ ok: true, id: data.result }, 200, cors);
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

// Проверка подписи по документации Telegram: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
async function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const dataCheck = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');

  const enc = new TextEncoder();
  const hmac = async (key, msg) => {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
  };
  const secret = await hmac(enc.encode('WebAppData'), botToken);
  const sign = [...(await hmac(secret, dataCheck))].map((x) => x.toString(16).padStart(2, '0')).join('');
  if (sign !== hash) return null;

  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 86400) return null; // не старше суток
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}
