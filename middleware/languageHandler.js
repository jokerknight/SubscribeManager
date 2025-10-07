const { locales } = require('../i18n');
const { defaultLanguage } = require('../config');
const availableLangs = Object.keys(locales);

function languageHandler(req, res, next) {
  // 1. Check for a language cookie (if you decide to use one)
  // let lang = req.cookies.lang;

  // 2. Check Accept-Language header
  const acceptLangHeader = req.headers['accept-language'];
  let lang = defaultLanguage;

  if (acceptLangHeader) {
    const langs = acceptLangHeader.split(',').map(l => l.split(';')[0].trim());
    for (const l of langs) {
      if (availableLangs.includes(l)) {
        lang = l;
        break;
      }
      // Handle cases like 'zh' matching 'zh-CN'
      const baseLang = l.split('-')[0];
      const matchedLang = availableLangs.find(al => al.startsWith(baseLang));
      if (matchedLang) {
        lang = matchedLang;
        break;
      }
    }
  }

  req.lang = lang;
  next();
}

module.exports = languageHandler;