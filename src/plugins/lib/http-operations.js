/* eslint-disable no-unused-vars */
const http = require('http');
const https = require('https');
const url = require('url');

const debug = require('debug')('app:http-operations');
const isLog = false;
const isDebug = false;

/**
 * @method request
 * @param {Object} opts 
 * @param {Function} cb 
 * 
 */
const request = (opts = {}, cb) => {
  const requester = opts.protocol === 'https:' ? https : http;
  return requester.request(opts, cb);
};

/**
 * @method urlExists
 * @param {String} target 
 * @returns {Promise}
 */
const urlExists = function (target) {
  return new Promise((resolve, reject) => {
    let uri;

    try {
      uri = url.parse(target);
    } catch (err) {
      reject(new Error(`Invalid url ${target}`));
    }

    const options = {
      method: 'HEAD',
      host: uri.host,
      protocol: uri.protocol,
      port: uri.port,
      path: uri.path,
      timeout: 5 * 1000,
    };

    const req = request(options, (res) => {
      const { statusCode } = res;

      if (statusCode >= 200 && statusCode < 300) {
        resolve(target);
      } else {
        reject(new Error(`Url ${target} not found.`));
      }
    });

    req.on('error', reject);

    req.end();
  });
};

module.exports = {
  urlExists,
};
