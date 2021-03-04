/* eslint-disable no-unused-vars */
// const { join } = require('path');
// const appRoot = join(__dirname, '../../../');

const debug = require('debug')('app:net-operations');

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

/**
 * @method isMyIp
 * @param {Array} ips
 * @returns {Boolean}
 */
const isMyIp = function (ips = []) {
  const findedIp = ips.find(ip => ip === getMyIp());
  return !!findedIp;
};

module.exports = {
  getLocalIpAddress,
  getIpAddresses,
  getHostname,
  getParseUrl,
  isIP,
  getMyIp,
  isMyIp
};
