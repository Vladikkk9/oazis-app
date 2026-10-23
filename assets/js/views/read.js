import { POSTS } from '../config/posts.js?v=7';
import { AGENCY } from '../config/agency.js?v=7';
import { header, postRow, postHero } from './parts.js?v=7';

export function read() {
  const withImg = POSTS.filter((p) => p.image);
  const rest = POSTS.filter((p) => !p.image);
  return {
    tab: 'read',
    html: `
    ${header({ title: 'Читать', home: true })}
    <div class="page-head">
      <h1 class="t-title">Рекомендуем прочитать</h1>
      <p class="t-body">Шесть материалов канала, с которых стоит начать знакомство с рынком курортной недвижимости.</p>
    </div>
    <div class="mt-24">${withImg.map(postHero).join('')}</div>
    <div class="group mt-12 stagger">${rest.map(postRow).join('')}</div>
    <div class="wrap mt-24">
      <button class="btn btn-tinted btn-block" data-open="${AGENCY.contacts.channel}" data-contact="channel">Открыть канал</button>
      <p class="t-small center mt-12">Публикации открываются в Telegram — вернуться в приложение можно в любой момент.</p>
    </div>`,
  };
}
