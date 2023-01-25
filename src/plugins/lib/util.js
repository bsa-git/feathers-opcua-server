/* eslint-disable no-unused-vars */
// const { join } = require('path');
const moment = require('moment');
const hash = require('object-hash');
const os = require('os');
const crypto = require('crypto');
const Color = require('color');
const chalk = require('chalk');
const logger = require('../../logger');
const { cwd } = require('process');
const appRoot = cwd();// join(__dirname, '../../../');
const { isString, isArray, isObject } = require('./type-of');

const loRound = require('lodash/round');
const loIsEqual = require('lodash/isEqual');
const loOmit = require('lodash/omit');
const loReplace = require('lodash/replace');
const loRange = require('lodash/range');
const loCloneDeep = require('lodash/cloneDeep');

const debug = require('debug')('app:util');
const isDebug = false;

// Is display assert
const displayAssert = typeof process === 'object' ? (process.env.DISPLAY_ASSERT ? true : false) : false;
// Get feathers-specs
const feathersSpecs = require(`${appRoot}/config/feathers-specs.json`) || {};
// List of interval Ids
const timerIntervalIds = [];

//--------------------- SYSTEM INFO -------------------//


/**
* Determine if environment allows test
* @method isTest
* @return {boolean}
*/
const isTest = function () {
  return (feathersSpecs.app.envTestModeName === process.env.NODE_ENV);
};

/**
* Determine if environment allows development
* @method isDev
* @return {boolean}
*/
const isDev = function () {
  return (feathersSpecs.app.envDevModeName === process.env.NODE_ENV);
};

/**
* Determine if environment allows production
* @method isProd
* @return {boolean}
*/
const isProd = function () {
  return (feathersSpecs.app.envProdModeName === process.env.NODE_ENV);
};

/**
* Is this application starts as service
* @method isStartAppAsService
* @return {boolean}
*/
const isStartAppAsService = function () {
  const isProd = (process.env.NODE_ENV === 'production');
  const isStartService = (process.env.START_APP === 'win_service');
  return isProd && isStartService;
};

/**
* Is show log for production
* @method isShowLog4Prod
* @return {boolean}
*/
const isShowLog4Prod = function () {
  const isProd = (process.env.NODE_ENV === 'production');
  if(!isProd) return true;
  if(process.env.IS_SHOW_LOG_FOR_PROD === undefined) return true;
  const isShowLog = isTrue(process.env.IS_SHOW_LOG_FOR_PROD);
  return isShowLog;
};

/**
 * @method sysMemUsage
 * @param {Number} precision
 * @param {String} thousands
 * @param {String} decimal
 * @returns {Object}
 * e.g. result -> {
 * totalmem: 123243434,
 * freemem: 1345234,
 * percentageMemUsed: 24.345,
 * }
 */
const sysMemUsage = function () {// sysMemUsage
  let result = {}, percentageMemUsed;
  //----------------------------
  const totalmem = os.totalmem();
  const freemem = os.freemem();
  percentageMemUsed = 1 - (freemem / totalmem);
  percentageMemUsed = percentageMemUsed * 100;

  result.totalmem = totalmem;
  result.freemem = freemem;
  result.percentageMemUsed = loRound(percentageMemUsed, 3);
  return result;
};

/**
 * Check condition, else no condition then new Error
 * @method assert
 * @param {Boolean|unknown|null|undefined|Function} cond 
 * @param {String} message 
 */
const assert = function (cond, message) {
  if (!cond) {
    const err = new Error(message);
    // istanbul ignore next
    if (displayAssert) {
      // tslint:disable:no-console
      console.log(chalk.whiteBright.bgRed('-----------------------------------------------------------'));
      console.log(chalk.whiteBright.bgRed(message));
      console.log(chalk.whiteBright.bgRed('-----------------------------------------------------------'));
    }
    throw err;
  }
};

/**
* @method checkCorrectEnumType
* @param {Object|Array} EnumType
* @param {Number} value
* @param {Boolean} isCatch
* @return {boolean}
*/
const checkCorrectEnumType = function (EnumType, value, isCatch = true) {
  try {
    assert(EnumType[value] !== undefined, `Invalid enum type value: ${value} for EnumType:`);
    return true;
  } catch (error) {
    if (isCatch) throw error;
    inspector(chalk.red(error.message), EnumType);
    return false;
  }
};

//--------------------- DATE TIME -------------------//
/**
* Pause
* @param {Number} ms
* @param {Boolean} show
* @return {Promise}
* e.g. await pause(1000, true) -> 'Pause: 1000 (MSec)'
*/
const pause = function (ms = 1000, show = false) {
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
 * @method clearMyInterval
 * @param {Number} id 
 * @param {Number} count 
 * @param {Number} maxCount 
 * @returns {Number}
 */
const clearMyInterval = (id, count, maxCount = 0) => {
  if (!maxCount) {
    clearInterval(id);
    return 0;
  }
  count++;
  if (count === maxCount) clearInterval(id);
  return count;
};

/**
 * @method clearIntervalIds
 */
const clearIntervalIds = () => {
  // clearIntervalIds
  for (let index = 0; index < timerIntervalIds.length; index++) {
    const intervalId = timerIntervalIds[index];
    if (!intervalId['_destroyed']) {
      clearInterval(intervalId);
    }
  }

  return getIntervalIds();
};

/**
 * @method addIntervalId
 * @param {Object} id 
 * @returns {Object[]}
 */
const addIntervalId = (id) => {
  timerIntervalIds.push(id);
  return timerIntervalIds;
};

/**
 * @method getIntervalIds
 * @returns {Number[]}
 */
const getIntervalIds = () => {
  return timerIntervalIds;
};

/**
 * @method isValidDateTime
 * e.g. dt='2013-02-08 09:30:26'|dt='2013-02-08T09:30:26'|dt='20130208T080910,123'|dt='20130208T080910.123'|dt='20130208T080910,123'|dt='20130208T08'
 * @param {Number|String} dt 
 * @returns {Boolean}
 */
const isValidDateTime = function (dt = '') {
  return !isNaN(Date.parse(dt));
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
  const date = getDate(dt, isUtc);
  const time = getTime(dt, isUtc);
  return `${date}T${time}`;
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
 * @method getTimeDurations
 * @param {String[]} timeList 
 * @param {String} unit 
 * @returns {Object}
 * e.g. { TimeDuration_1(ms): 12, ..., TimeDuration_10(ms): 5, TimeDuration_1x10(ms): 50  }
 */
const getTimeDurations = function (timeList, unit) {
  let resultList = {}, prevTime = '';
  //------------------------------------------------
  for (let index = 0; index < timeList.length; index++) {
    const currentTime = timeList[index];
    if (prevTime) {
      resultList[`TimeDuration_${index}(${unit ? unit : 'ms'})`] = getTimeDuration(prevTime, currentTime, unit);
    }
    prevTime = currentTime;
  }
  if (timeList.length > 1) {
    resultList[`TimeDuration_1x${timeList.length}(${unit ? unit : 'ms'})`] = getTimeDuration(timeList[0], timeList[timeList.length - 1], unit);
  }
  return resultList;
};

/**
 * @method getNextDateTime
 * @param {Object|String|Array} startTime 
 * @param {Array} period 
 * e.g. [1, 'hours']
 * @param {Boolean} isUtc 
 * @returns {String}
 */
const getNextDateTime = function (startDateTime, period, isUtc = true) {
  let _startDateTime;
  //---------------------------------------------
  if (isUtc) {
    _startDateTime = moment.utc(startDateTime);
  } else {
    _startDateTime = moment(startDateTime);
  }
  const nextDateTime = _startDateTime.add(period[0], period[1]);
  return nextDateTime.format();
};

/**
 * @method getPreviousDateTime
 * @param {Object|String|Array} startTime 
 * @param {Array} period 
 * e.g. [1, 'hours']
 * @param {Boolean} isUtc 
 * @returns {String}
 */
const getPreviousDateTime = function (startDateTime, period, isUtc = true) {
  let _startDateTime;
  //---------------------------------------------
  if (isUtc) {
    _startDateTime = moment.utc(startDateTime);
  } else {
    _startDateTime = moment(startDateTime);
  }
  const nextDateTime = _startDateTime.subtract(period[0], period[1]);
  return nextDateTime.format();
};

/**
 * @method getStartOfPeriod
 * @param {Object|String|Array} dateTime 
 * e.g. moment()|'2022-05-15T10:55:11'|[2022, 4, 15, 10, 55, 11]
 * @param {Array} period
 * e.g. [1, 'months'] | [-1, 'months']
 * @returns {String} 
 * e.g. '2022-05-01T00:00:00' | '2022-04-01T00:00:00'
 */
const getStartOfPeriod = function (dateTime, period) {
  let startList = [], startPeriod, condition;
  let _dateTime = cloneObject(dateTime), _period = cloneObject(period);
  //-----------------------------------------
  if (!Array.isArray(_period)) new Error('Argument error, argument "period" must be an array');
  // Get start dateTime
  if (_period[0] < 0) {
    _dateTime = moment.utc(_dateTime).subtract(Math.abs(_period[0]), _period[1]).format('YYYY-MM-DDTHH:mm:ss');
    _period[0] = Math.abs(_period[0]);
  } else {
    _dateTime = moment.utc(_dateTime).format('YYYY-MM-DDTHH:mm:ss');
  }
  startPeriod = moment.utc(_dateTime).startOf('year');
  startList.push(startPeriod.format('YYYY-MM-DDTHH:mm:ss'));

  do {
    startPeriod = startPeriod.add(..._period);
    const _startPeriod = startPeriod.format('YYYY-MM-DDTHH:mm:ss');
    if (isDebug && _startPeriod) console.log('util.getStartOfPeriod._startPeriod:', _startPeriod);
    condition = (_dateTime >= startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    if (condition) {
      startList.push(startPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    }
  } while (condition);

  if (isDebug && startList.length) console.log('util.getStartOfPeriod.startList:', startList);
  return startList[startList.length - 1];
};

/**
 * @method getEndOfPeriod
 * @param {Object|String|Array} dateTime 
 * e.g. moment()|'2022-05-15T10:55:11'|[2022, 4, 15, 10, 55, 11]
 * @param {Array} period
 * e.g. [1, 'months'] | [-1, 'months']
 * @returns {String} 
 * e.g. '2022-05-31T23:59:59' | '2022-04-31T23:59:59'
 */
const getEndOfPeriod = function (dateTime, period) {
  let startList = [], startPeriod, endPeriod, condition;
  let _dateTime = cloneObject(dateTime), _period = cloneObject(period);
  //--------------------------------------------------------------------
  if (!Array.isArray(_period)) new Error('Argument error, argument "period" must be an array');
  // Get start dateTime
  if (_period[0] < 0) {
    _dateTime = moment.utc(_dateTime).subtract(Math.abs(_period[0]), _period[1]).format('YYYY-MM-DDTHH:mm:ss');
    _period[0] = Math.abs(_period[0]);
  } else {
    _dateTime = moment.utc(_dateTime).format('YYYY-MM-DDTHH:mm:ss');
  }
  startPeriod = moment.utc(_dateTime).startOf('year');
  startPeriod = startPeriod.add(..._period).format('YYYY-MM-DDTHH:mm:ss');
  endPeriod = moment.utc(startPeriod).subtract(1, 'seconds');

  do {
    const _endPeriod = endPeriod.format('YYYY-MM-DDTHH:mm:ss');
    if (isDebug && _endPeriod) console.log('util.getEndOfPeriod._endPeriod:', _endPeriod);
    startList.push(endPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    condition = (_dateTime > endPeriod.format('YYYY-MM-DDTHH:mm:ss'));
    startPeriod = moment.utc(startPeriod).add(..._period).format('YYYY-MM-DDTHH:mm:ss');
    endPeriod = moment.utc(startPeriod).subtract(1, 'seconds');
  } while (condition);

  if (isDebug && startList.length) console.log('util.getStartOfPeriod.startList:', startList);
  return startList[startList.length - 1];
};

/**
 * @method getStartEndOfPeriod
 * @param {Object|String|Array} dateTime 
 * e.g. moment()|'2022-05-15T10:55:11'|[2022, 4, 15, 10, 55, 11]
 * @param {Array} period
 * e.g. [1, 'months'] 
 * @returns {String[]} 
 * e.g. ['2022-05-01T00:00:00', '2022-05-31T23:59:59']
 */
const getStartEndOfPeriod = function (dateTime, period) {
  const start = getStartOfPeriod(dateTime, period);
  const end = getEndOfPeriod(dateTime, period);
  return [start, end];
};

/**
 * @method getRangeStartEndOfPeriod
 * @param {Object|String|Array} dateTime 
 * e.g. moment()|'2022-05-15T10:55:11'|[2022, 4, 15, 10, 55, 11]
 * @param {Array} period
 * e.g. [5, 'years']|[-5, 'years']|moment()|'2022-05-15T10:55:11'|[2022, 4, 15, 10, 55, 11]
 * @param {String} unit
 * e.g. 'years'|'months'|'days'|'hours'|'minutes'|'seconds'
 * @returns {Number[]} 
 * e.g. ['2022', '2023', '2024', '2025', '2026'] | ['2017', '2018', '2019', '2020', '2021']
 */
const getRangeStartEndOfPeriod = function (dateTime = '', period, unit = 'years') {
  let rangeList = [], condition, unitFormat;
  let startPeriod, endPeriod;
  //----------------------------

  if (!dateTime) dateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss');

  if (Array.isArray(period) && period.length === 2) {
    startPeriod = getStartOfPeriod(dateTime, period);
    endPeriod = getEndOfPeriod(dateTime, period);
  } else {
    startPeriod = moment.utc(dateTime).format('YYYY-MM-DDTHH:mm:ss');
    endPeriod = moment.utc(period).format('YYYY-MM-DDTHH:mm:ss');
  }

  // Get unitFormat
  if (unit === 'years') unitFormat = 'YYYY';
  if (unit === 'months') unitFormat = 'YYYY-MM';
  if (unit === 'days') unitFormat = 'YYYY-MM-DD';
  if (unit === 'hours') unitFormat = 'YYYY-MM-DDTHH';
  if (unit === 'minutes') unitFormat = 'YYYY-MM-DDTHH:mm';
  if (unit === 'seconds') unitFormat = 'YYYY-MM-DDTHH:mm:ss';

  rangeList.push(moment.utc(startPeriod).format(unitFormat));

  do {
    startPeriod = moment.utc(startPeriod).add(...[1, unit]).format(unitFormat);
    condition = (endPeriod >= startPeriod);
    if (condition) {
      rangeList.push(startPeriod);
    }
  } while (condition);
  return rangeList;
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

//--------------------- CRYPTO -------------------//

/**
 * Random bytes
 * @param len
 * @return {Promise}
 * @private
 */
const randomBytes = function(len) {
  // return new Promise(function (resolve, reject) {
  //   crypto.randomBytes(len, function (err, buf) {
  //     return err ? reject(err) : resolve(buf.toString('hex'));
  //   });
  // });

  const buf = crypto.randomBytes(len);
  return buf.toString('hex');
};

/**
 * Random digits
 * @param len
 * @return {string}
 * @private
 */
const randomDigits = function(len) {
  let str = '';
  while (str.length < len) {
    str += parseInt('0x' + crypto.randomBytes(4).toString('hex')).toString();
  }
  return str.substring(0, len);
};

/**
* @async
* @method getLongToken
* @param {Number} len
* @return {String}
*/
const getLongToken = function(len) {
  // return await randomBytes(len);
  return randomBytes(len);
};

/**
* @async
* @method getShortToken
* @param {Number} len
* @param {Boolean} ifDigits
* @return {String}
*/
const getShortToken = function(len, ifDigits) {
  // if (ifDigits) {
  //   return Promise.resolve(randomDigits(len));
  // }

  // let str = await randomBytes(Math.floor(len / 2) + 1);
  // str = str.substring(0, len);
  // if (str.match(/^[0-9]+$/)) {
  //   // tests will fail on all digits
  //   str = 'q' + str.substring(1); // shhhh, secret.
  // }
  // return str;

  if (ifDigits) {
    return randomDigits(len);
  }

  let str = randomBytes(Math.floor(len / 2) + 1);
  str = str.substring(0, len);
  if (str.match(/^[0-9]+$/)) {
    // tests will fail on all digits
    str = 'q' + str.substring(1); // shhhh, secret.
  }
  return str;
};

//--------------------- STRING -------------------//

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

/**
 * Replace string
 * @param {String} value 
 * @param {String} substr 
 * @param {String} newSubstr 
 * @returns 
 */
const strReplace = function (value, substr, newSubstr = '') {
  const regEx = new RegExp(substr, 'gi');
  const replacedValue = value.replace(regEx, newSubstr);
  return replacedValue;
};

/**
 * Replace string extended
 * @param {String} value 
 * e.g. 'c:\\temp\\lib'
 * @param {String|RegExp} substr 
 * e.g. String -> '\\'
 * e.g. RegExp -> /\\/gi
 * @param {String} newSubstr 
 * e.g. '/'
 * @returns {String} 
 * e.g. 'c:/temp\\lib'
 * e.g. 'c:/temp/lib'
 */
const strReplaceEx = function (value, substr, newSubstr = '') {
  const replacedValue = loReplace(value, substr, newSubstr);
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

//-------------- CONVERT STRING TO BOOLEAN/INTEGER/FLOAT ---------------//
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
 * @method formatNumber
 * @param {Number} number 
 * @param {Number} precision 
 * @param {String} thousands 
 * @param {String} decimal 
 * @returns {String}
 */
function formatNumber(number, precision = 0, thousands = ' ', decimal = ',') {
  let decimalSeparator = '.';
  let thousandSeparator = thousands;
  //------------------------------------
  // Set precision
  if (precision) {
    number = loRound(number, precision);
  }

  // make sure we have a string
  let result = String(number);

  // split the number in the integer and decimals, if any
  let parts = result.split(decimalSeparator);

  // reverse the string (1719 becomes 9171)
  result = parts[0].split('').reverse().join('');

  // add thousand separator each 3 characters, except at the end of the string
  result = result.replace(/(\d{3}(?!$))/g, '$1' + thousandSeparator);

  // reverse back the integer and replace the original integer
  parts[0] = result.split('').reverse().join('');

  // recombine integer with decimals
  return parts.join(decimal);
}

//-------------- REGEX ---------------//

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

//-------------- VIEW DATA ---------------//

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
 * The value to recursively clone
 * @method cloneObject
 * @param {Object?} obj - Object to clone
 * @returns {Object} Cloned object
 */
const cloneObject = function (obj) {
  return loCloneDeep(obj);
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

//-------------- OBJECTS COMPARISON ---------------//

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
  let result = { isDeepStrictEqual: undefined, isDeepEqual: undefined };
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

  if (isDeepEqual(object1, object2, omit, isView)) {
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
    if (result === false) break;
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
 * Generate a hash from any object or type. Defaults to sha1 with hex encoding.
 * @method objectHash
 * @param {Object|Array|any} value 
 * @param {Object} options 
 * algorithm hash algo to be used: 'sha1', 'md5', 'passthrough'. default: sha1
  This supports the algorithms returned by crypto.getHashes(). Note that the default of SHA-1 is not considered secure, 
  and a stronger algorithm should be used if a cryptographical hash is desired.
  This also supports the passthrough algorith, which will return the information that would otherwise have been hashed.
 * excludeValues {true|false} hash object keys, values ignored. default: false
 * encoding hash encoding, supports 'buffer', 'hex', 'binary', 'base64'. default: hex
 * ignoreUnknown {true|*false} ignore unknown object types. default: false
 * replacer optional function that replaces values before hashing. default: accept all values
 * respectFunctionProperties {true|false} Whether properties on functions are considered when hashing. default: true
 * respectFunctionNames {true|false} consider name property of functions for hashing. default: true
 * respectType {true|false} Whether special type attributes (.prototype, .__proto__, .constructor) are hashed. default: true
 * unorderedArrays {true|false} Sort all arrays before hashing. Note that this affects all collections, i.e. including typed arrays, Sets, Maps, etc. default: false
 * unorderedSets {true|false} Sort Set and Map instances before hashing, i.e. make hash(new Set([1, 2])) == hash(new Set([2, 1])) return true. default: true
 * unorderedObjects {true|false} Sort objects before hashing, i.e. make hash({ x: 1, y: 2 }) === hash({ y: 2, x: 1 }). default: true
 * excludeKeys optional function for excluding specific key(s) from hashing, if true is returned then exclude from hash. default: include all keys
 * @returns {String}
 */
const objectHash = function (value, options) {
  return hash(value, options);
};

/**
 * Hash using the sha1 algorithm.
 * Note that SHA-1 is not considered secure, and a stronger algorithm should be used if a cryptographical hash is desired.
 * Sugar method, equivalent to hash(value, {algorithm: 'sha1'})
 * @method objectHashSha1
 * @param {Object|Array|any} value 
 * @returns {String}
 */
const objectHashSha1 = function (value) {
  return hash.sha1(value);
};

/**
 * Hash object keys using the sha1 algorithm, values ignored
 * Sugar method, equivalent to hash(value, {excludeValues: true})
 * @method objectHashKeys
 * @param {Object|Array|any} value 
 * @returns {String}
 */
const objectHashKeys = function (value) {
  return hash.keys(value);
};

/**
 * Hash using the md5 algorithm.
 * Note that the MD5 algorithm is not considered secure, and a stronger algorithm should be used if a cryptographical hash is desired.
 * @method objectHashMD5
 * @param {Object|Array|any} value 
 * @returns {String}
 */
const objectHashMD5 = function (value) {
  return hash.MD5(value);
};

/**
 * Hash object keys using the md5 algorithm, values ignored.
 * Note that the MD5 algorithm is not considered secure, and a stronger algorithm should be used if a cryptographical hash is desired.
 * Sugar method, equivalent to hash(value, {algorithm: 'md5', excludeValues: true})
 * @method objectHashKeysMD5
 * @param {Object|Array|any} value 
 * @returns {String}
 */
const objectHashKeysMD5 = function (value) {
  return hash.keysMD5(value);
};

/**
 * Write the information that would otherwise have been hashed to a stream.
 * Note that the MD5 algorithm is not considered secure, and a stronger algorithm should be used if a cryptographical hash is desired.
 * @method objectHashMD5
 * @param {Object|Array|any} value 
 * @param {Stream} stream 
 * @param {Object} options 
 * @returns {String}
 * e.g. hash.writeToStream({foo: 'bar', a: 42}, {respectType: false}, process.stdout)
 * e.g. -> 'object:a:number:42foo:string:bar'
 */
const objectHashWriteToStream = function (value, stream, options = {}) {
  return hash.writeToStream(value, options, stream);
};

//-------------- COLOR ---------------//

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
  logger,
  isTest,
  isDev,
  isProd,
  isStartAppAsService,
  isShowLog4Prod,
  feathersSpecs,
  sysMemUsage,
  assert,
  checkCorrectEnumType,
  pause,
  waitTimeout,
  waitTill,
  clearMyInterval,
  clearIntervalIds,
  addIntervalId,
  getIntervalIds,
  isValidDateTime,
  dtToObject,
  getDate,
  getTime,
  getDateTime,
  getTimeDuration,
  getTimeDurations,
  getNextDateTime,
  getPreviousDateTime,
  getStartOfPeriod,
  getEndOfPeriod,
  getStartEndOfPeriod,
  getRangeStartEndOfPeriod,
  shiftTimeByOneHour,
  getLongToken,
  getShortToken,
  stripSlashes,
  stripSpecific,
  strReplace,
  strReplaceEx,
  getCapitalizeStr,
  isTrue,
  getInt,
  getFloat,
  formatNumber,
  getRegex,
  inspector,
  inspectorToLog,
  qlParams,
  stringify,
  cloneObject,
  getRandomValue,
  isDeepStrictEqual,
  isDeepEqual,
  objectHash,
  objectHashSha1,
  objectHashKeys,
  objectHashMD5,
  objectHashKeysMD5,
  objectHashWriteToStream,
  rgbToARGB,
  hexToARGB,
  hexToRGBA
};
