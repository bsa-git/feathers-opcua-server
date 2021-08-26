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
 * @method urlExists
 * @param {String} target 
 * @returns {Promise}
 */
const urlExists = async function (target) {
  let uri;
  try {
    uri = url.parse(target);
  } catch (error) {
    throw new Error(`Invalid url ${target}`);
  }

  try {
    await axios.get(uri);
  } catch (error) {
    if(isDebug) console.log('http-operations.checkExistUrl.error.code:', error.code);
    if(isLog) inspector('http-operations.checkExistUrl.error.config:', error.config);
    if(isLog) inspector('http-operations.checkExistUrl.error.headers:', error.headers);
    if (error.response) {
      // Request made and server responded
      if(isLog) inspector('http-operations.checkExistUrl.error.response.status:', error.response.status);
      if(isLog) inspector('http-operations.checkExistUrl.error.response.data:', error.response.data);
      if(isLog) inspector('http-operations.checkExistUrl.error.response.headers:', error.response.headers);
    }
    throw error;
  }

    
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
