// Состояние квиза. Хранится в sessionStorage, чтобы ответы не терялись при переходах
// и перезагрузке WebView. Все обращения к хранилищу обёрнуты в try/catch.

const KEY = 'oazis.quiz.v1';

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

let state = { answers: {}, editing: false, ...read() };

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* приватный режим и т.п. */ }
}

// Каталоги, открытые после заявки. localStorage — чтобы не просить контакт повторно.
const UNLOCK_KEY = 'oazis.unlocked.v1';
function readUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_KEY)) || [];
  } catch {
    return [];
  }
}

export const catalogAccess = {
  isOpen: (c) => !c.locked || readUnlocked().includes(c.id),
  unlock(id) {
    try {
      localStorage.setItem(UNLOCK_KEY, JSON.stringify([...new Set([...readUnlocked(), id])]));
    } catch { /* приватный режим */ }
  },
};

export const store = {
  get answers() {
    return { ...state.answers };
  },
  setAnswer(id, value) {
    state.answers = { ...state.answers, [id]: value };
    persist();
  },
  reset() {
    state = { answers: {}, editing: false };
    persist();
  },
  get editing() {
    return state.editing;
  },
  set editing(v) {
    state.editing = v;
    persist();
  },
};
