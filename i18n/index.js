const fs = require('fs');
const path = require('path');
const { defaultLanguage } = require('../config');

const locales = {};

const localesDir = path.join(__dirname, '../public/locales');
fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.slice(0, -5);
    const data = fs.readFileSync(path.join(localesDir, file), 'utf8');
    locales[lang] = JSON.parse(data);
  }
});

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

function t(lang, key, params) {
  const langDict = locales[lang] || locales[defaultLanguage];
  const template = get(langDict, key) || key;

  if (typeof template !== 'string') {
    return key;
  }

  if (!params) return template;
  return template.replace(/\{(.*?)\}/g, (_, paramKey) => {
    return params[paramKey] != null ? String(params[paramKey]) : `{${paramKey}}`;
  });
}

module.exports = { t, locales };