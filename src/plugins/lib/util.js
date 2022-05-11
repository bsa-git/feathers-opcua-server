/* eslint-disable no-unused-vars */
const { join } = require('path');
const moment = require('moment');
const Color = require('color');
const chalk = require('chalk');
const appRoot = join(__dirname, '../../../');
const { isString, isArray, isObject } = require('./type-of');

const loRound = require('lodash/round');
const loToPlainObject = require('lodash/toPlainObject');
const loIsEqual = require('lodash/isEqual');
const loIsFunction = require('lodash/isFunction');
const loOmit = require('lodash/omit');

const debug = require('debug')('app:util');

/**
 * Delay time
 * @param sec
 * @return {Promise}
 * e.g. await delayTime(2);
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
 * Delay
 * @param {Number} ms 
 * @returns {Promise}
 * e.g. delay(1000).then(() => alert("Hello!"))
 */
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

/**
* Pause
* @param {Number} ms
* @param {Boolean} show
* @return {Promise}
* e.g. await pause(1000);
*/
const pause = function (ms, show = true) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      if(show) console.log('Pause: ', chalk.cyan(`${ms} (MSec)`));
      resolve('done!');
    }, ms);
  });
};

/**
 * Awaiting positive completion of a function
 * @param {Function} fn
 * @param {Function|any} cb
 * @param delay
 */
const waitTimeout = function (fn, cb = null, delay = 0) {
  let result;
  //------------------------
  let _delay = delay ? delay : 1000;
  let timerId = setTimeout(function request() {
    if (loIsFunction(cb)) {
      result = fn();
    } else {
      result = fn(cb);
    }

    if (!result) {
      timerId = setTimeout(request, _delay);
    } else {
      if (loIsFunction(cb)) cb();
      clearInterval(timerId);
    }
  }, _delay);
};

/**
 * @method isValidDateTime
 * e.g. dt='2013-02-08 09:30:26'|dt='2013-02-08T09:30:26'|dt='20130208T080910,123'|dt='20130208T080910.123'|dt='20130208T080910,123'|dt='20130208T08'
 * @param {Number|String} dt 
 * @returns {Boolean}
 */
const isValidDateTime = function (dt = '') {
  return moment(dt).isValid();
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
  const months = dt.months > 9 ? dt.months : `0${dt.months}`;
  const date = dt.date > 9 ? dt.date : `0${dt.date}`;
  return `${dt.years}-${months}-${date}`;
};

/**
 * @method getTime
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {String} e.g. 15:50:10.134
 */
const getTime = function (dt = '', isUtc = true) {
  dt = dtToObject(dt, isUtc);
  const hours = dt.hours > 9 ? dt.hours : `0${dt.hours}`;
  const minutes = dt.minutes > 9 ? dt.minutes : `0${dt.minutes}`;
  const seconds = dt.seconds > 9 ? dt.seconds : `0${dt.seconds}`;
  return `${hours}:${minutes}:${seconds}.${dt.milliseconds}`;
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
 * @method getTimeDuration
 * @param {Object|String|Array} startTime 
 * @param {Object|String|Array} endTime 
 * @param {String} unit 
 * e.g. years, months, weeks, days, hours, minutes, seconds, and milliseconds 
 * @returns {Number}
 */
const getTimeDuration = function (startTime, endTime, unit) {
  startTime = moment.utc(startTime);
  endTime = moment.utc(endTime);
  if (unit) {
    return endTime.diff(startTime, unit);
  } else {
    return endTime.diff(startTime);// return -> milliseconds
  }
};

/**
 * @method getTimeDuration
 * @param {Object|String|Array} startTime 
 * @param {Array} period 
 * e.g. [1, 'hours']
 * @param {Boolean} isUtc 
 * @returns {Number}
 */
const getNextDateTime = function (startDateTime, period, isUtc = true) {
  startDateTime = moment.utc(startDateTime);
  const nextDateTime = moment.utc(startDateTime).add(period[0], period[1]);
  if (isUtc) {
    return moment.utc(nextDateTime).format();
  } else {
    return moment(nextDateTime).format();
  }
};

/**
 * Shift time by one hour
 * @method shiftTimeByOneHour
 * @param {Number|String} dt 
 * @param {Boolean} isUtc 
 * @returns {String} 
 * e.g. 2021-01-10T00:00:00.000 -> 2021-01-10T01:00:00.000 ... 2021-01-10T23:00:00.000 -> 2021-01-10T00:00:00.000
 */
const shiftTimeByOneHour = function (dt = '', isUtc = true) {
  let dtString = '';
  //---------------------------
  if (isUtc) {
    dtString = moment.utc(dt).format();
  } else {
    dtString = moment(dt).format();
  }

  dt = dtToObject(dt, isUtc);
  const hours = dt.hours;
  switch (hours) {
  case 0:
    dtString = strReplace(dtString, '00:', '01:');
    break;
  case 1:
    dtString = strReplace(dtString, '01:', '02:');
    break;
  case 2:
    dtString = strReplace(dtString, '02:', '03:');
    break;
  case 3:
    dtString = strReplace(dtString, '03:', '04:');
    break;
  case 4:
    dtString = strReplace(dtString, '04:', '05:');
    break;
  case 5:
    dtString = strReplace(dtString, '05:', '06:');
    break;
  case 6:
    dtString = strReplace(dtString, '06:', '07:');
    break;
  case 7:
    dtString = strReplace(dtString, '07:', '08:');
    break;
  case 8:
    dtString = strReplace(dtString, '08:', '09:');
    break;
  case 9:
    dtString = strReplace(dtString, '09:', '10:');
    break;
  case 10:
    dtString = strReplace(dtString, '10:', '11:');
    break;
  case 11:
    dtString = strReplace(dtString, '11:', '12:');
    break;
  case 12:
    dtString = strReplace(dtString, '12:', '13:');
    break;
  case 13:
    dtString = strReplace(dtString, '13:', '14:');
    break;
  case 14:
    dtString = strReplace(dtString, '14:', '15:');
    break;
  case 15:
    dtString = strReplace(dtString, '15:', '16:');
    break;
  case 16:
    dtString = strReplace(dtString, '16:', '17:');
    break;
  case 17:
    dtString = strReplace(dtString, '17:', '18:');
    break;
  case 18:
    dtString = strReplace(dtString, '18:', '19:');
    break;
  case 19:
    dtString = strReplace(dtString, '19:', '20:');
    break;
  case 20:
    dtString = strReplace(dtString, '20:', '21:');
    break;
  case 21:
    dtString = strReplace(dtString, '21:', '22:');
    break;
  case 22:
    dtString = strReplace(dtString, '22:', '23:');
    break;
  case 23:
    dtString = strReplace(dtString, '23:', '00:');
    break;
  default:
    break;
  }
  return dtString;
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
 * @param {Number} precision 
 * @returns {Number}
 */
const getFloat = function (value, precision = 0) {
  if (Number.isNaN(Number.parseFloat(value))) {
    return 0;
  }
  if (precision) {
    return loRound(parseFloat(value), precision);
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
const isDeepStrictEqual = function (object1, object2, omit = []) {
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
      !areObjects && !loIsEqual(val1, val2)
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
const isDeepEqual = function (object1, object2, omit = []) {
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
      !areObjects && !loIsEqual(val1, val2)
    ) {
      result = false;
      break;
    }
  }
  return result;
};

/**
 * Color rgb to argb
 * @param {String|Object|Array|Arguments} color 
 * e.g. color = [255, 255, 255]
 * e.g. color = {r: 255, g: 255, b: 255}
 * e.g. color = 'rgb(255, 255, 255)'
 * e.g. color = 255, 255, 255
 * @returns {String}
 * e.g. FFF2DCDB
 */
const rgbToARGB = function (color) {
  let argbColor = '';
  //-------------------------
  if (isArray(color)) {// color = [255, 255, 255]
    argbColor = Color.rgb(color).hex().replace('#', 'FF');
  }
  if (isObject(color)) {// color = {r: 255, g: 255, b: 255}
    argbColor = Color(color).hex().replace('#', 'FF');
  }
  if (isString(color)) {// color = 'rgb(255, 255, 255)'
    argbColor = Color(color).hex().replace('#', 'FF');
  }
  if (!argbColor) {// color = 255, 255, 255
    argbColor = Color.rgb(arguments[0], arguments[1], arguments[2]).hex().replace('#', 'FF');
  }
  return argbColor;
};

/**
 * Color hex to argb
 * @param {String} color 
 * e.g. color = #9E9E9E
 * @returns {String}
 * e.g. FF9E9E9E
 */
const hexToARGB = function (color) {
  return color ? color.replace('#', 'FF') : '';
};

/**
 * Color hex to rgba
 * @param {String} color 
 * e.g. color = #9E9E9E
 * @returns {String}
 * e.g. 9E9E9EFF
 */
const hexToRGBA = function (color) {
  return `${color.replace('#', '')}FF`;
};

module.exports = {
  appRoot,
  delayTime,
  pause,
  delay,
  waitTimeout,
  isValidDateTime,
  dtToObject,
  getDate,
  getTime,
  getDateTime,
  getTimeDuration,
  getNextDateTime,
  shiftTimeByOneHour,
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
  isDeepEqual,
  rgbToARGB,
  hexToARGB,
  hexToRGBA
};
