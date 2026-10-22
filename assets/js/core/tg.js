// Обёртка над Telegram Web Apps API с безопасными заглушками для обычного браузера.

const W = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
// В браузере telegram-web-app.js тоже создаёт объект WebApp, но без initData и платформы 'unknown'.
const inside = Boolean(W && (W.initData || (W.platform && W.platform !== 'unknown')));

export const tg = {
  inside,
  raw: W,

  init() {
    this.syncTheme();
    if (!inside) {
      // Обычный браузер: следуем системной теме.
      window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => this.syncTheme());
    }
    if (!W) return;
    try {
      W.ready();
      W.expand();
      W.disableVerticalSwipes?.();
      this.syncTheme();
      W.onEvent?.('themeChanged', () => this.syncTheme());
      W.onEvent?.('safeAreaChanged', () => this.syncInsets());
      W.onEvent?.('contentSafeAreaChanged', () => this.syncInsets());
      this.syncInsets();
    } catch (e) {
      console.warn('[tg] init failed', e);
    }
  },

  colorScheme() {
    if (inside && W.colorScheme) return W.colorScheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  syncTheme() {
    const scheme = this.colorScheme();
    document.documentElement.dataset.theme = scheme;
    const bg = scheme === 'dark' ? '#0D1011' : '#F3F2EE';
    try {
      W?.setHeaderColor?.(bg);
      W?.setBackgroundColor?.(bg);
      W?.setBottomBarColor?.(bg);
    } catch { /* старые клиенты */ }
  },

  syncInsets() {
    if (!inside) return;
    const s = W.safeAreaInset || {};
    const c = W.contentSafeAreaInset || {};
    const root = document.documentElement.style;
    root.setProperty('--tg-top', `${(s.top || 0) + (c.top || 0)}px`);
    root.setProperty('--tg-bottom', `${(s.bottom || 0) + (c.bottom || 0)}px`);
  },

  // Ссылки: t.me — внутри Telegram без закрытия приложения; остальные — во внешнем браузере.
  open(url) {
    const isTg = /^https?:\/\/t\.me\//i.test(url);
    try {
      if (inside && isTg && W.openTelegramLink) return W.openTelegramLink(url);
      if (inside && W.openLink) return W.openLink(url, { try_instant_view: false });
    } catch (e) {
      console.warn('[tg] open failed, fallback', e);
    }
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      window.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener');
  },

  haptic(kind = 'light') {
    try {
      const h = W?.HapticFeedback;
      if (!inside || !h) return;
      if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
      else if (kind === 'select') h.selectionChanged();
      else h.impactOccurred(kind);
    } catch { /* noop */ }
  },

  backButton(visible, handler) {
    const bb = W?.BackButton;
    if (!inside || !bb) return;
    try {
      bb.offClick(this._backHandler || (() => {}));
      if (visible) {
        this._backHandler = handler;
        bb.onClick(handler);
        bb.show();
      } else {
        bb.hide();
      }
    } catch { /* noop */ }
  },

  // Номер телефона в одно нажатие (Bot API 6.9+). Telegram показывает системный диалог «Поделиться».
  // Контакт также приходит боту сообщением — сервер может сверить номер.
  canRequestContact() {
    try {
      return inside && typeof W.requestContact === 'function' && (!W.isVersionAtLeast || W.isVersionAtLeast('6.9'));
    } catch {
      return false;
    }
  },

  requestContact() {
    return new Promise((resolve) => {
      if (!this.canRequestContact()) return resolve(null);
      try {
        W.requestContact((shared, res) => {
          const c = res?.responseUnsafe?.contact;
          resolve(shared && c?.phone_number ? { phone: c.phone_number, firstName: c.first_name || '' } : null);
        });
      } catch {
        resolve(null);
      }
    });
  },

  // Данные пользователя Telegram (без отправки куда-либо). Нужны только для будущей заявки.
  user() {
    return inside ? W.initDataUnsafe?.user || null : null;
  },

  initData() {
    return inside ? W.initData || '' : '';
  },

  startParam() {
    return inside ? W.initDataUnsafe?.start_param || null : new URLSearchParams(location.search).get('startapp');
  },
};
