(function () {
  const DEFAULT_LANG = localStorage.getItem('lang') || (navigator.language || 'zh-CN').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  const LOCALE_BASE = '/locales';

  const state = {
    lang: DEFAULT_LANG,
    dict: {},
    loaded: false
  };

  function formatString(template, params) {
    if (!params) return template;
    return template.replace(/\{(.*?)\}/g, (_, key) => {
      return params[key] != null ? String(params[key]) : '{' + key + '}';
    });
  }

  function get(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  async function loadLocale(lang) {
    const url = `${LOCALE_BASE}/${lang}.json`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error('Failed to load locale: ' + lang);
    state.dict = await res.json();
    state.lang = lang;
    state.loaded = true;
    document.documentElement.setAttribute('lang', lang);
  }

  function t(key, params) {
    const value = get(state.dict, key);
    if (typeof value === 'string') return formatString(value, params);
    return key;
  }

  function translateElement(el) {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    let params = undefined;
    const args = el.getAttribute('data-i18n-args');
    if (args) {
      try { params = JSON.parse(args); } catch (_) {}
    }
    const htmlMode = el.hasAttribute('data-i18n-html');
    const translated = t(key, params);
    if (htmlMode) {
      el.innerHTML = translated;
    } else {
      el.textContent = translated;
    }

    // Attributes support
    const placeholderKey = el.getAttribute('data-i18n-placeholder');
    if (placeholderKey) {
      el.setAttribute('placeholder', t(placeholderKey, params));
    }
    const titleKey = el.getAttribute('data-i18n-title');
    if (titleKey) {
      el.setAttribute('title', t(titleKey, params));
    }
    const ariaLabelKey = el.getAttribute('data-i18n-aria-label');
    if (ariaLabelKey) {
      el.setAttribute('aria-label', t(ariaLabelKey, params));
    }
  }

  function translateDOM(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(translateElement);
  }

  async function setLang(lang) {
    if (lang === state.lang && state.loaded) {
      translateDOM();
      return;
    }
    await loadLocale(lang);
    localStorage.setItem('lang', lang);
    translateDOM();
    // Dispatch event to allow custom code to react
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  async function init() {
    try {
      await loadLocale(state.lang);
      translateDOM();
      document.addEventListener('click', function (e) {
        const target = e.target.closest('[data-set-lang]');
        if (target) {
          const lang = target.getAttribute('data-set-lang');
          if (lang) setLang(lang);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  window.i18n = { init, setLang, t, translateDOM, get lang() { return state.lang; } };
})();


