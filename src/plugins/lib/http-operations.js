/* eslint-disable no-unused-vars */
const http = require('http');
const https = require('https');
const url = require('url');
const axios = require('axios');
const cheerio = require('cheerio');

const {
  inspector,
  stripSlashes
} = require('./util');

const {
  sortByString,
} = require('./array-operations');

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
    req.on('error', (err) => {
      reject(new Error(`Unknown error "${err.message}".`));
    });
    req.end();
  });
};

/**
 * @method httpGetNewFileFromDir
 * @param {String} url 
 * @returns {Object}
 */
const httpGetNewFileFromDir = async function (url) {
  // Get fileNames from target 
  url = stripSlashes(url);
  let response = await axios.get(url);
  let data = response.data;
  const $ = cheerio.load(data);
  let filenames = [];
  $('pre a').each(function () {
    filenames.push($(this).text());
  });
  filenames = filenames.filter(item => !(item.includes('[') && item.includes(']')));
  filenames = sortByString(filenames, false);
  if (isLog) inspector('httpGetLastFileFromDir.filenames:', filenames);
  // inspector('httpGetLastFileFromDir.filenames:', filenames);
  // Get content from last file
  if (filenames.length) {
    url = `${url}/${filenames[0]}`;
    response = await axios.get(url);
    data = response.data;
    if (isLog) inspector(`httpGetLastFileFromDir (${filenames[0]}):`, data);
    // inspector(`HttpOperations: get data from file (${filenames[0]}):`, dataItems);
    return { name: filenames[0], data };
  }
};

module.exports = {
  urlExists,
  httpGetNewFileFromDir
};
