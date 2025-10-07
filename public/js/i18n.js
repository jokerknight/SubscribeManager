(function () {
  const LOCALE_BASE = '/locales';

  let defaultDict = {}; // 用于存储默认（英文）翻译
  const state = {
    lang: 'zh-CN', // 默认语言，将在 init 中根据 localStorage 或 navigator.language 设置
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
    let currentLangDict = {};
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        currentLangDict = await res.json();
      } else {
        console.warn(`Failed to load locale: ${lang}. Using default English locale.`);
      }
    } catch (e) {
      console.error(`Error loading locale ${lang}:`, e);
    }

    state.dict = Object.assign({}, defaultDict, currentLangDict); // 合并字典，当前语言覆盖英文
    state.lang = lang;
    state.loaded = true;
    document.documentElement.setAttribute('lang', lang);
    updateLanguageButtons(lang);
  }

  function t(key, params) {
    let value = get(state.dict, key);
    if (typeof value === 'string') return formatString(value, params);

    // 如果当前语言没有找到，尝试回退到默认英文
    value = get(defaultDict, key);
    if (typeof value === 'string') return formatString(value, params);

    return key; // 如果默认英文也找不到，直接返回键本身
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
    console.log(`setLang called with: ${lang}`);
    if (lang === state.lang && state.loaded) {
      console.log(`Language ${lang} already loaded and active.`);
      translateDOM();
      return;
    }
    await loadLocale(lang); // loadLocale 内部会更新 state.lang 和调用 updateLanguageButtons
    localStorage.setItem('lang', lang);
    console.log(`Language ${lang} saved to localStorage.`);
    translateDOM(); // 确保 DOM 重新翻译
    // Dispatch event to allow custom code to react
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
    console.log(`setLang finished for: ${lang}`);
  }

  // 新增：更新语言按钮的 active 状态
  function updateLanguageButtons(currentLang) {
    document.querySelectorAll('.lang-select-btn').forEach(button => {
      if (button.getAttribute('data-set-lang') === currentLang) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  async function init() {
    try {
      // 预加载默认中文翻译，作为回退
      try {
        const defaultUrl = `${LOCALE_BASE}/zh-CN.json`;
        const defaultRes = await fetch(defaultUrl, { headers: { 'Content-Type': 'application/json' } });
        if (defaultRes.ok) {
          defaultDict = await defaultRes.json();
        } else {
          console.warn('Failed to preload default English locale.');
        }
      } catch (e) {
        console.error('Error preloading default English locale:', e);
      }

      const savedLang = localStorage.getItem('lang');
      let initialLang = savedLang;

      if (!initialLang) {
        initialLang = (navigator.language || 'zh-CN').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
      }
      state.lang = initialLang; // 确保 state.lang 在这里被正确设置

      await loadLocale(initialLang);
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


