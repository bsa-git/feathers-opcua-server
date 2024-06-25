/* eslint-disable no-unused-vars */
const dns = require('dns');

const { logger, inspector } = require('./util');

const debug = require('debug')('app:net-operations');
const isDebug = false;

//---------------- NET -------------//

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

/**
 * @method getIpAddresses
 * @returns {Array}
 */
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

/*
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = Object.create(null);

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Пропускаем не-IPv4 и внутренние (например, 127.0.0.1) адреса
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

// Пример результата:
// {
//     "en0": ["192.168.1.101"],
//     "eth0": ["10.0.0.101"],
//     "<имя сети>": ["<IP-адрес>", "<псевдоним IP>", ...]
// }

// Пример использования:
const ipAddress = '192.168.1.10';
if (results['en0'] && results['en0'].includes(ipAddress)) {
  console.log('Этот IP-адрес является локальным.');
} else {
  console.log('Этот IP-адрес относится к сети Интернет.');
}
*/

/**
 * @method getHostname
 * @returns {String}
 */
const getHostname = function () {
  const os = require('os');
  return os.hostname().toLowerCase();
};


/**
 * Get an instance of a class 'URL'
 * @method getPaseUrl
 * The absolute or relative input URL to parse. If input is relative, then base is required. If input is absolute, the base is ignored.
 * @param {String} url
 * The base URL to resolve against if the input is not absolute. 
 * @param {String} base 
 * @returns {Object}
 * e.g. url.hash
        url.host
        url.hostname
        url.href
        url.origin
        url.password
        url.pathname
        url.port
        url.protocol
        Special schemes
        url.search
        url.searchParams
        url.username
        url.toString()
        url.toJSON()
 */
const getParseUrl = function (url, base) {
  const URL = require('url').URL;
  return new URL(url, base);
};

/**
 * Get URL
 * @method getURL
 * @param {String} pathname 
 * @param {String} baseURL
 * @returns {String}
 */
const getURL = (pathname = '', baseURL = '') => {
  const URL = require('url').URL;
  if (!baseURL) {
    const port = process.env.PORT || 3131;
    const host = process.env.HOST || 'localhost';
    baseURL = process.env.BASE_URL ? process.env.BASE_URL : `http://${host}:${port}`;
  }

  let url = new URL(pathname, baseURL);
  url = url.href;
  return url;
};

/**
 * @method validateURL
 * @param {String | URL} baseURL 
 * @returns 
 */
const validateURL = (baseURL) => {
  const URL = require('url').URL;
  try {
    new URL('', baseURL);
  } catch (error) {
    logger.error(`Validate error URL("${baseURL}")`);
    throw error;
  }
};

/**
 * @method isValidURL
 * @param {String | URL} baseURL 
 * @returns 
 */
const isValidURL = (baseURL) => {
  try {
    validateURL(baseURL);
    return true;
  } catch (error) {
    return false;
  }
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

/**
 * @method getMyEnvPort
 * @returns {Number}
 */
const getMyEnvPort = function () {
  return process.env.PORT;
};


/**
 * @method checkPort
 * @async
 * @param {Number} port 
 * @param {String} host 
 * @returns {Number|Error}
 */
const checkPort = function (port, host) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const socket = new net.Socket();

    socket.on('connect', () => {
      socket.destroy();
      resolve(port);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Port ${port} not used on the host "${host}"`));
    });

    socket.on('error', () => {
      socket.destroy();
      reject(new Error(`Port ${port} not used on the host "${host}"`));
    });

    socket.connect(port, host);
  });
};

/**
 * @method isMyIp
 * @param {Array} ips
 * @param {Boolean} exclude
 * @returns {Boolean}
 */
const isMyIp = function (ips = [], exclude = true) {
  const findedIp = ips.find(ip => exclude ? ip !== getMyIp() : ip === getMyIp());
  return !!findedIp;
};

/**
 * Set my "localhost" to my IP
 * @method setLocalhostToIP
 * e.g. "localhost" -> "10.60.5.128"
 * e.g. "http://localhost:3030" -> "http://10.60.5.128:3030"
 */
const setLocalhostToIP = function () {
  const { isMyLocalhostToIP } = require('../opcua/opcua-helper');

  const isLocalhost = process.env.HOST === 'localhost';
  if (isMyLocalhostToIP() && isLocalhost && getMyIp()) {
    process.env.HOST = getMyIp();
    process.env.BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;
    if (isDebug && process.env.HOST) {
      console.log('process.env.HOST', process.env.HOST);
      console.log('process.env.BASE_URL', process.env.BASE_URL);
    }
  }
  return process.env.BASE_URL;
};

//---------------- DNS -------------//

/**
 * @method dnsLookup
 * @param {String} url 
 * @returns {Promise}
 */
const dnsLookup = function (url) {
  return new Promise((resolve, reject) => {
    dns.lookup(url, (err, addresses, family) => {
      if (err) {
        console.log('dnsLookup.error: ', err);
        reject('dnsLookup ERR');
        return;
      }
      resolve({ addresses, family });
    });
  });
};


module.exports = {
  getLocalIpAddress,
  getIpAddresses,
  getHostname,
  getParseUrl,
  getURL,
  validateURL,
  isValidURL,
  isIP,
  getMyIp,
  isMyIp,
  setLocalhostToIP,
  getMyEnvPort,
  checkPort,
  dnsLookup
};
