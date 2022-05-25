/* eslint-disable no-unused-vars */
const { join } = require('path');
const moment = require('moment');
const Color = require('color');
const chalk = require('chalk');
const logger = require('../../logger');
const appRoot = join(__dirname, '../../../');
const { isString, isArray, isObject } = require('./type-of');

const loRound = require('lodash/round');
const loToPlainObject = require('lodash/toPlainObject');
const loIsEqual = require('lodash/isEqual');
const loIsFunction = require('lodash/isFunction');
const loOmit = require('lodash/omit');
const loDelay = require('lodash/delay');
const loMerge = require('lodash/merge');

const debug = require('debug')('app:util');
const isDebug = false;

/**
* Pause
* @param {Number} ms
* @param {Boolean} show
* @return {Promise}
* e.g. await pause(1000, true) -> 'Pause: 1000 (MSec)'
*/
const pause = function (ms, show = false) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      if (show) console.log('Pause: ', chalk.cyan(`${ms} (MSec)`));
      resolve('done!');
    }, ms);
  });
};

/**
 * Awaiting negative completion of a function
 * @async
 * @method waitTimeout
 * @param {Function} fn
 * @param {Array} args
 * @param {Number} wait
 * e.g. result = fn(...args); if(result === false) then -> return from cycle 
 */
const waitTimeout = async (fn, args = [], wait = 1000) => {
  while (fn(...args)) {
    await pause(wait, true);
  }
};

/**
 * @method waitTill
 * @param {Function} fn 
 * @param {Array} args 
 * @param {Function} thenDo 
 * @param {Array} args2 
 * @returns 
 */
const waitTill = (fn, args = [], thenDo, args2 = []) => {
  const isWait = fn(...args);
  if (!isWait) {
    thenDo(...args2);
    return;
  }
  setTimeout(() => { waitTill(fn, args = [], thenDo, args2 = []); }, 1000);
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
 * @method getStartOfPeriod
 * @param {Object|String|Array} dateTime 
 * @param {Array} period
 * e.g. [1, 'years'] 
 * @returns {Object} 
 */
const getStartOfPeriod = function (dateTime, period) {
  let startList = [], startPeriod, condition;
  //------------------------
  // Get start dateTime
  dateTime = moment.utc(dateTime); 
  dateTime = dateTime.format('YYYY-MM-DDTHH:mm:ss');
  startPeriod = moment.utc(dateTime).startOf('year');

  do {
    startList.push(startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    startPeriod = startPeriod.add(...period);
    condition = (dateTime >= startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
  } while (condition);
  
  if(isDebug && startList.length) console.log('util.getStartOfPeriod.startList:', startList);
  return startList[startList.length - 1];
};

/**
 * @method getEndOfPeriod
 * @param {Object|String|Array} dateTime 
 * @param {Array} period
 * e.g. [1, 'years'] 
 * @returns {Object} 
 */
const getEndOfPeriod = function (dateTime, period) {
  let startList = [], startPeriod, condition;
  //------------------------
  // Get start dateTime
  dateTime = moment.utc(dateTime); 
  dateTime = dateTime.format('YYYY-MM-DDTHH:mm:ss');
  startPeriod = moment.utc(dateTime).startOf('year');

  do {
    startList.push(startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    startPeriod = startPeriod.add(...period);
    condition = (dateTime >= startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    if(!condition){
      startPeriod = startPeriod.subtract(1, 'seconds');
      startList.push(startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    }
  } while (condition);
  
  if(isDebug && startList.length) console.log('util.getStartOfPeriod.startList:', startList);
  return startList[startList.length - 1];
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
 * @returns {Object}
 * e.g. { isDeepStrictEqual: false,  isDeepEqual: undefined }
 * e.g. { isDeepStrictEqual: true,  isDeepEqual: false }
 * e.g. { isDeepStrictEqual: true,  isDeepEqual: true }
 */
const isDeepStrictEqual = function (object1, object2, omit = [], isView = false) {
  let result = { isDeepStrictEqual: undefined,  isDeepEqual: undefined };
  //---------------------
  object1 = loOmit(object1, omit);
  object2 = loOmit(object2, omit);

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    if (isView && (keys1.length !== keys2.length)) {
      logger.error('util.isDeepStrictEqual: length of keys1(%d) for object1 is not equivalent to length of keys2(%d) for object2', keys1.length, keys2.length);
      inspector('util.isDeepStrictEqual.object1', object1);
      inspector('util.isDeepStrictEqual.object2', object2);
    }
    return result.isDeepStrictEqual = false;
  }
  
  result.isDeepStrictEqual = true;
  
  if(isDeepEqual(object1, object2, omit, isView)){
    result.isDeepEqual = true;
  } else {
    result.isDeepEqual = false;
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
const isDeepEqual = function (object1, object2, omit = [], isView = false) {
  let result = true;
  //---------------------
  object1 = loOmit(object1, omit);
  object2 = loOmit(object2, omit);

  const keys1 = Object.keys(object1);

  for (const key of keys1) {
    if(result === false) break;
    const val1 = object1[key];
    const val2 = object2[key];
    const areArrays = Array.isArray(val1) && Array.isArray(val2);
    if (areArrays) {
      if (val1.length !== val2.length) {
        if (isView && (val1.length !== val2.length)) {
          logger.error('util.isDeepEqual: val1.length(%d) for object1 is not equivalent to val2.length(%d) for object2', val1.length, val2.length);
          inspector('util.isDeepEqual.val1', val1);
          inspector('util.isDeepEqual.val2', val2);
        }
        result = false;
        break;
      }
      for (let index = 0; index < val1.length; index++) {
        const item1 = val1[index];
        const item2 = val2[index];
        const areObjects = isObject(item1) && isObject(item2);
        if (
          areObjects && !isDeepEqual(item1, item2, omit) ||
          !areObjects && !loIsEqual(item1, item2)
        ) {
          if (isView && (item1 || item2)) {
            logger.error(`util.isDeepEqual: val1('${item1}') of object1 is not equivalent to val2('${item2}') of object2.`);
            inspector('util.isDeepEqual.val1', val1);
            inspector('util.isDeepEqual.val2', val2);
          }
          result = false;
          break;
        }
      }
    } else {
      const areObjects = isObject(val1) && isObject(val2);
      if (
        areObjects && !isDeepEqual(val1, val2, omit) ||
        !areObjects && !loIsEqual(val1, val2)
      ) {
        if (isView && (val1 || val2)) {
          logger.error(`util.isDeepEqual: val1 for key('${key}') of object1 is not equivalent to val2 for key('${key}') of object2.`);
          inspector(`util.isDeepEqual.${key}:`, val1);
          inspector(`util.isDeepEqual.${key}:`, val2);
        }
        result = false;
        break;
      }
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
  pause,
  waitTimeout,
  waitTill,
  isValidDateTime,
  dtToObject,
  getDate,
  getTime,
  getDateTime,
  getTimeDuration,
  getNextDateTime,
  getStartOfPeriod,
  getEndOfPeriod,
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
