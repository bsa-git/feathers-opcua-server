/* eslint no-console: 0 */

function getTypeOf (value) {
  return typeof value;
}

function getValueType (val) {
  if(isArray(val)){
    return 'Array';
  }
  if(isBoolean(val)){
    return 'Boolean';
  }
  if(isFunction(val)){
    return 'Function';
  }
  if(isNull(val)){
    return 'Null';
  }
  if(isUndefined(val)){
    return 'Undefined';
  }
  if(isObject(val)){
    return 'Object';
  }
  if(isString(val)){
    return 'String';
  }
  if(isNumber(val)){
    return 'Number';
  }
  if(isSymbol(val)){
    return 'Symbol';
  }
  return 'Error';
}

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
  getTypeOf,
  getValueType,
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
