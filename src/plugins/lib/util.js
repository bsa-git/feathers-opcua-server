
const { join } = require('path');
const moment = require('moment');
const debug = require('debug')('app:util');
const appRoot = join(__dirname, '../../../');

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
 * Strip slashes
 * @param value String
 * @return {XML|string|*|void}
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
 * Get number from value
 * @param value
 * @return {number}
 */
const getNumber = function (value) {
  return Number.isInteger(value) ? value : Number.parseInt(value);
};

/**
 * Get Regex
 * @param type
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
  console.log(`\n${desc}`);
  console.log(inspect(obj, { depth, colors: true }));
};

/**
 * Query params
 * @param obj
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
 * @param obj
 * @param spacer
 * @param separator
 * @param leader
 * @param trailer
 * @returns {string}
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
  return Object.assign({}, obj1);
};

/**
 * Get dbNullIdValue
 * e.g. for mongodb -> '000000000000000000000000'
 * @return {*}
 */
const dbNullIdValue = function () {
  let result = null;
  if (process.env.TYPE_DB === 'mongodb') result = process.env.MONGODB_NULL_ID_VALUE;
  return result;
};

//---------------- SORT -------------//

/**
 * sort array by string field
 * @param items {Array}
 * @param name {String}
 * @param isAscending {Boolean}
 */
const sortByStringField = function (items, name, isAscending = true) {
  items.sort((x, y) => {
    let textA = x[name].toLocaleUpperCase();
    let textB = y[name].toLocaleUpperCase();
    if (isAscending) return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    if (!isAscending) return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
  });
};

/**
 * sort array by number field
 * @param items {Array}
 * @param name {String}
 * @param isAscending {Boolean}
 */
const sortByNumberField = function (items, name, isAscending = true) {
  items.sort((x, y) => {
    if (isAscending) return x[name] - y[name];
    if (!isAscending) return y[name] - x[name];
  });
};

/**
 * sort array by string
 * @param items {Array}
 * @param isAscending {Boolean}
 */
const sortByString = function (items, isAscending = true) {
  items.sort((x, y) => {
    let textA = x.toLocaleUpperCase();
    let textB = y.toLocaleUpperCase();
    if (isAscending) return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    if (!isAscending) return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
  });
};

/**
 * sort array by number field
 * @param items {Array}
 * @param isAscending {Boolean}
 */
const sortByNumber = function (items, isAscending = true) {
  items.sort((x, y) => {
    if (isAscending) return x - y;
    if (!isAscending) return y - x;
  });
};

//---------------- OS -------------//

/**
 * @method getLocalIpAddress
 * @returns {Object}
 */
const getLocalIpAddress = function () {
  const { networkInterfaces } = require('os');

  const nets = networkInterfaces();
  const results = {}; // or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }

        results[name].push(net.address);
      }
    }
  }
  return results;
};

const getIpAddresses = function () {
  const ipAddresses = [];
  const { networkInterfaces } = require('os');
  const interfaces = networkInterfaces();
  Object.keys(interfaces).forEach(function (interfaceName) {
    let alias = 0;

    interfaces[interfaceName].forEach((iFace) => {
      if ('IPv4' !== iFace.family || iFace.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        // console.log(interfaceName + ':' + alias, iFace.address);
        ipAddresses.push(iFace.address);
      } else {
        // this interface has only one ipv4 address
        // console.log(interfaceName, iFace.address);
        ipAddresses.push(iFace.address);
      }
      ++alias;
    });
  });
  return ipAddresses;
};

/**
 * @method getHostname
 * @returns {String}
 */
const getHostname = function () {
  const os = require('os');
  return os.hostname().toLowerCase();
};// url.parse

/**
 * @method getPaseUrl
 * @param {String} aUrl
 * @returns {Object}
 */
const getParseUrl = function (aUrl) {
  const url = require('url');
  return url.parse(aUrl);
};

/**
 * @method isIP
 * @param {String} ip 
 * @returns {Int32}
 */
const isIP = function (ip) {
  const net = require('net');
  return net.isIP(ip);
};

/**
 * @method getMyIp
 * @returns {String}
 */
const getMyIp = function () {
  return getIpAddresses().length ? getIpAddresses()[0] : '';
};


module.exports = {
  appRoot,
  delayTime,
  pause,
  waitTimeout,
  dtToObject,
  getDate,
  getTime,
  stripSlashes,
  stripSpecific,
  strReplace,
  getCapitalizeStr,
  isTrue,
  getNumber,
  getRegex,
  inspector,
  qlParams,
  stringify,
  cloneObject,
  dbNullIdValue,
  sortByStringField,
  sortByNumberField,
  sortByString,
  sortByNumber,
  getLocalIpAddress,
  getIpAddresses,
  getHostname,
  getParseUrl,
  isIP,
  getMyIp
};
