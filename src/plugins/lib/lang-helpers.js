const { readJsonFileSync } = require('./file-operations');
const { inspector, appRoot } = require('./util');
const detect = require('detect-lang');
const errors = require('@feathersjs/errors');
const debug = require('debug')('app:plugins.lang-helpers');
const isLog = false;

/**
 * Detect language by text
 * etc. 'en' | 'ru'
 * @param text
 * @return {String}
 */
module.exports.detectLang = async function (text) {
  try {
    const _text = text.padEnd(64, '.');
    const detectResult = await detect(_text);
    if (isLog) inspector('plugins.lang-helpers.detectResult:', detectResult);
    return detectResult.iso6391;
  } catch (err) {
    if (isLog) debug('detectLang.error:', err);
    if (err.message === 'Not a recognized language') {
      return process.env.FALLBACK_LOCALE;
    } else {
      new errors.BadRequest(`Error while recognized language: ${err.message}`);
    }
  }
};

/**
 * Get lang messages
 * @param lang
 * @return {Object}
 */
module.exports.getLangMessages = function (lang) {
  let path = `${appRoot}/src/plugins/localization/locales/${lang}.json`;
  let msgs = readJsonFileSync(path);
  if (!msgs) {
    path = `${appRoot}/src/plugins/localization/locales/${process.env.FALLBACK_LOCALE}.json`;
    msgs = readJsonFileSync(path);
  }
  return msgs;
};
