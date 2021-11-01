/* eslint-disable no-unused-vars */
const { join } = require('path');
const moment = require('moment');
const chalk = require('chalk');
const appRoot = join(__dirname, '../../../');
const { isObject } = require('./type-of');

const loRound = require('lodash/round');
const loToPlainObject = require('lodash/toPlainObject');
const loIsEqual = require('lodash/isEqual');
const loOmit = require('lodash/omit');

const debug = require('debug')('app:util');

/**
 * Delay time
 * @param sec
 * @return {Promise}
 */
const delayTime = function (sec = 1) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      debug(`delayTime: ${sec * 1000} MSec`);
      resolve('done!');
    }, sec * 1000);
  });
};

/**
* Pause
* @param ms
* @return {Promise}
*/
const pause = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      debug(`Pause: ${ms} MSec`);
      resolve('done!');
    }, ms);
  });
};

/**
 * Awaiting positive completion of a function
 * @param fn
 * @param cb
 * @param delay
 */
const waitTimeout = function (fn, cb = null, delay = 0) {
  let _delay = delay ? delay : 1000;
  let timerId = setTimeout(function request() {
    let result = fn();
    if (!result) {
      timerId = setTimeout(request, _delay);
    } else {
      if (cb) cb();
      clearInterval(timerId);
    }
  }, _delay);
};

/**
 * @method dtToObject
 * e.g. { year: 2020, month: 9, date: 22, hours: 13, minutes: 31, seconds: 10, milliseconds: 555 }
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {Object}
 */
const dtToObject = function (dt = '', isUtc = true) {
  if (isUtc) {
    dt = moment.utc(dt === '' ? undefined : dt);
  } else {
    dt = moment(dt === '' ? undefined : dt);
  }
  dt = dt.toObject();
  dt.months = dt.months + 1;
  return dt;
};

/**
 * @method getDate
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {String} e.g. 2021-01-10
 */
const getDate = function (dt = '', isUtc = true) {
  dt = dtToObject(dt, isUtc);
  return `${dt.years}-${dt.months}-${dt.date}`;
};

/**
 * @method getTime
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {String} e.g. 15:50:10.134
 */
const getTime = function (dt = '', isUtc = true) {
  dt = dtToObject(dt, isUtc);
  return `${dt.hours}:${dt.minutes}:${dt.seconds}.${dt.milliseconds}`;
};

/**
 * @method getDateTime
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {String} e.g. 2021-01-10T15:50:10.134
 */
const getDateTime = function (dt = '', isUtc = true) {
  dt = dtToObject(dt, isUtc);
  return `${dt.years}-${dt.months}-${dt.date}T${dt.hours}:${dt.minutes}:${dt.seconds}.${dt.milliseconds}`;
};

/**
 * Strip slashes
 * @param value String
 * @return {String}
 */
const stripSlashes = function (value) {
  return value.replace(/^(\/*)|(\/*)$/g, '');
};

/**
 * Strip slashes
 * @param value String
 * @param symbol String
 * @return {string|*|void}
 */
const stripSpecific = function (value, symbol = '') {
  const regEx = new RegExp('^[' + symbol + ']+|[' + symbol + ']+$', 'g');
  const trimValue = symbol ? value.replace(regEx, '') : value.trim();
  return trimValue;
};

const strReplace = function (value, substr, newSubstr = '') {
  const regEx = new RegExp(substr, 'gi');
  const replacedValue = value.replace(regEx, newSubstr);
  return replacedValue;
};

/**
 * Get capitalize string
 * @param value
 * @param prefix
 */
const getCapitalizeStr = function (value, prefix = '') {
  const loCapitalize = require('lodash/capitalize');
  const loWords = require('lodash/words');
  let _value = loCapitalize(value);
  if (prefix) {
    let words = loWords(_value).map(word => loCapitalize(word));
    _value = words.join('');
    _value = prefix + _value;
  }
  return _value;
};

/**
 * Is true
 * @param value String|Any
 * @return boolean
 */
const isTrue = function (value) {
  if (typeof (value) === 'string') {
    value = value.trim().toLowerCase();
  }
  switch (value) {
  case true:
  case 'true':
  case 1:
  case '1':
  case 'on':
  case 'yes':
    return true;
  default:
    return false;
  }
};

/**
 * Get int number from value
 * @method getInt
 * @param {any} value
 * @return {number}
 */
const getInt = function (value) {
  if (Number.isNaN(Number.parseInt(value))) {
    return 0;
  }
  return Number.isInteger(value) ? value : Number.parseInt(value);
};

/**
 * @method getFloat
 * @param {any} value 
 * @returns {Number}
 */
const getFloat = function (value) {
  if (Number.isNaN(Number.parseFloat(value))) {
    return 0;
  }
  return parseFloat(value);
};

/**
 * Get Regex
 * @param {String} type
 * @return {String}
 */
const getRegex = function (type) {
  if (typeof (type) === 'string') {
    type = type.trim().toLowerCase();
  }
  switch (type) {
  case 'phone':
    /*
                    (123) 456-7890
                    +(123) 456-7890
                    +(123)-456-7890
                    +(123) - 456-7890
                    +(123) - 456-78-90
                    123-456-7890
                    123.456.7890
                    1234567890
                    +31636363634
                    +380980029669
                    075-63546725
                    */
    return '^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\\s\\./0-9]*$';
  case 'zip_code':
    /*
                    12345
                    12345-6789
                    */
    return '^[0-9]{5}(?:-[0-9]{4})?$';
  case 'lat':
    /*
                    +90.0
                    45
                    -90
                    -90.000
                    +90
                    47.123123
                    */
    return '^(\\+|-)?(?:90(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\\.[0-9]{1,6})?))$';
  case 'long':
    /*
                    -127.554334
                    180
                    -180
                    -180.0000
                    +180
                    179.999999
                    */
    return '^(\\+|-)?(?:180(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\\.[0-9]{1,6})?))$';
  case 'lat_and_long':
    /*
                    +90.0, -127.554334
                    45, 180
                    -90, -180
                    -90.000, -180.0000
                    +90, +180
                    47.1231231, 179.99999999
                    */
    return '^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$';
  default:
    return '//g';
  }
};


/**
 * Inspector to display objects
 * @param desc
 * @param obj
 * @param depth
 */
const inspector = function (desc, obj, depth = 6) {
  const { inspect } = require('util');
  // console.log(`\n${desc}`);
  console.log('\n', chalk.cyan(desc));
  console.log(inspect(obj, { depth, colors: true }));
};

/**
 * inspectorForLog to save returned inspect info to "data/app-log/inspector.log"
 * @param {String} desc
 * @param {Object} obj
 * @param {String} logName
 * @param {Number} depth
 */
const inspectorToLog = function (desc, obj, logName = 'inspector.log', depth = 6) {
  const { inspect } = require('util');
  const { writeFileSync } = require('./file-operations');
  desc = '\n' + desc;
  let log = desc + inspect(obj, { depth, colors: false });
  writeFileSync([appRoot, `data/app-log/${logName}`], log);
};

/**
 * Query params
 * @param {Object} obj
 * @returns {string}
 */
const qlParams = function (obj) {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Expected object. (qlParams)');
  }

  return stringify(obj, undefined, undefined, '', '');
};

/**
 * Stringify to represent an object as a string
 * @param {Object} obj
 * @param {String} spacer
 * @param {String} separator
 * @param {String} leader
 * @param {String} trailer
 * @returns {String}
 */
const stringify = function (obj, spacer = ' ', separator = ', ', leader = '{', trailer = '}') {
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }

  const str = Object
    .keys(obj)
    .map(key => `${key}:${spacer}${stringify(obj[key], spacer, separator)}`)
    .join(', ');

  return `${leader}${str}${trailer}`;
};

/**
 * Returns new object with values cloned from the original object. Some objects
 * (like Sequelize or MongoDB model instances) contain circular references
 * and cause TypeError when trying to JSON.stringify() them. They may contain
 * custom toJSON() or toObject() method which allows to serialize them safely.
 * Object.assign() does not clone these methods, so the purpose of this method
 * is to use result of custom toJSON() or toObject() (if accessible)
 * for Object.assign(), but only in case of serialization failure.
 *
 * @param {Object?} obj - Object to clone
 * @returns {Object} Cloned object
 */
const cloneObject = function (obj) {
  let obj1 = obj;
  if (typeof obj.toJSON === 'function' || typeof obj.toObject === 'function') {
    try {
      JSON.stringify(Object.assign({}, obj1));
    } catch (e) {
      debug('Object is not serializable');
      obj1 = obj1.toJSON ? obj1.toJSON() : obj1.toObject();
    }
  }
  return loToPlainObject(obj1);
};

/**
 * @method getRandomValue
 * @param {Number} v 
 * @returns {Number}
 */
const getRandomValue = function (v = 10) {
  let value = (Math.sin(v / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
  return loRound(value, 3);
};

/**
 * Is deep strict equal
 * @param {Object} object1 
 * @param {Object} object2 
 * @param {Array} omit
 * @returns {Boolean}
 */
const isDeepStrictEqual = function(object1, object2, omit = []) {
  let result = true;
  //---------------------
  object1 = loOmit(object1, omit);
  object2 = loOmit(object2, omit);

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      areObjects && !isDeepStrictEqual(val1, val2, omit) ||
      !areObjects &&  !loIsEqual(val1, val2)
    ) {
      result = false;
      break;
    }
  }
  return result;
};

/**
 * Is deep equal
 * @param {Object} object1 
 * @param {Object} object2 
 * @param {Array} omit
 * @returns {Boolean}
 */
const isDeepEqual = function(object1, object2, omit = []) {
  let result = true;
  //---------------------
  object1 = loOmit(object1, omit);
  object2 = loOmit(object2, omit);

  const keys1 = Object.keys(object1);
  
  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      areObjects && !isDeepEqual(val1, val2, omit) ||
      !areObjects &&  !loIsEqual(val1, val2)
    ) {
      result = false;
      break;
    }
  }
  return result;
};

module.exports = {
  appRoot,
  delayTime,
  pause,
  waitTimeout,
  dtToObject,
  getDate,
  getTime,
  getDateTime,
  stripSlashes,
  stripSpecific,
  strReplace,
  getCapitalizeStr,
  isTrue,
  getInt,
  getFloat,
  getRegex,
  inspector,
  inspectorToLog,
  qlParams,
  stringify,
  cloneObject,
  getRandomValue,
  isDeepStrictEqual,
  isDeepEqual
};
