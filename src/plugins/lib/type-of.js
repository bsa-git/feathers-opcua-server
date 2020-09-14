
/* eslint no-console: 0 */

function isArray (array) {
  return Array.isArray(array);
}

function isBoolean(bool) {
  return bool === true || bool === false;
}

function isFunction (func) {
  return typeof func === 'function';
}

function isNull (obj) {
  return obj === null;
}

function isUndefined (obj) {
  return obj === undefined;
}

function isNullOrUndefined (obj) {
  return obj === null || obj === undefined;
}

function isObject (obj) {
  return typeof obj === 'object' && obj !== null;
}

function isString (str) {
  return typeof str === 'string';
}

function isNumber (val) {
  return typeof val === 'number';
}

function isSymbol (val) {
  return typeof val === 'symbol';
}

module.exports = {
  isArray,
  isBoolean,
  isFunction,
  isNull,
  isUndefined,
  isNullOrUndefined,
  isObject,
  isString,
  isNumber,
  isSymbol
};
