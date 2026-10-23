import { AGENCY } from '../config/agency.js?v=4';
import { esc, icon } from '../core/ui.js?v=4';
import { header, photo } from './parts.js?v=4';

export function about() {
  const c = AGENCY.contacts;
  const row = (ic, title, sub, url, key) =>
    `<button class="row-item icon" data-open="${esc(url)}" data-contact="${key}"><span class="ibox">${icon(ic)}</span><div><div class="t-h3">${esc(title)}</div><div class="meta">${esc(sub)}</div></div>${icon('chevR', 'chev')}</button>`;

  return {
    tab: 'about',
    html: `
    ${header({ title: 'Об агентстве', home: true })}
    <section class="about-hero">
      ${photo('assets/img/objects/leeprime.jpg', 'Роза Хутор', { eager: true })}
      <div class="panel glass-dark">
        <span class="logo" role="img" aria-label="Oazis Estate"></span>
        <h1 class="t-title">${esc(AGENCY.tagline)}</h1>
        <p>${esc(AGENCY.lead)}</p>
      </div>
    </section>

    <div class="facts">
      ${AGENCY.facts.map((f) => `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}
    </div>

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">Как мы работаем</h2></div>
      <div class="group stagger">
        ${AGENCY.approach.map((a, i) => `<div class="row-item icon" style="--i:${i};grid-template-columns:36px 1fr"><span class="ibox">${icon(a.icon)}</span><div><div class="t-h3">${esc(a.title)}</div><div class="meta" style="font-size:14px">${esc(a.text)}</div></div></div>`).join('')}
      </div>
    </section>

    <section class="section">
      <blockquote class="quote">
        <p>${esc(AGENCY.founder.quote)}</p>
        <div class="who"><b>${esc(AGENCY.founder.name)}</b>, ${esc(AGENCY.founder.role)}</div>
      </blockquote>
    </section>

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">С чем приходят</h2></div>
      <div class="split">
        ${AGENCY.audiences.map((a) => `<div><div class="share">${esc(a.share)}</div><div class="t-h3">${esc(a.title)}</div><ul>${a.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}
      </div>
      <p class="services mt-16">Также: ${AGENCY.services.map((s) => esc(s.toLowerCase())).join(', ')}.</p>
    </section>

    <section class="section">
      <a class="feature" href="#" data-action="consult" style="min-height:300px">
        ${photo('assets/img/objects/alean-select-agoy.jpg', '')}
        <div class="panel glass-dark">
          <h2 class="t-h2">Обсудим вашу задачу</h2>
          <p>Расскажем о проектах честно — с плюсами и минусами.</p>
          <span class="btn btn-white btn-block">Получить консультацию</span>
        </div>
      </a>
    </section>

    <section class="section">
      <div class="sec-head"><h2 class="t-h2">Контакты</h2></div>
      <div class="group">
        ${row('telegram', 'Написать менеджеру', '@oazis_estate', c.manager, 'manager')}
        ${row('phone', c.phone, 'Бесплатно по России', c.phoneHref, 'phone')}
        ${row('read', 'Telegram-канал', '@oazisestate', c.channel, 'channel')}
        ${row('globe', 'Сайт', 'oazis.estate', c.site, 'site')}
        ${row('mail', c.email, 'Почта', `mailto:${c.email}`, 'email')}
        <div class="row-item icon" style="grid-template-columns:36px 1fr"><span class="ibox">${icon('pin')}</span><div><div class="t-h3">Офис в Сочи</div><div class="meta">${esc(c.address.replace('Сочи, ', ''))}</div></div></div>
      </div>
    </section>`,
  };
}
