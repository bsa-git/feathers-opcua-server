/* eslint-disable no-unused-vars */
const url = require('url');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../logger');

const {
  inspector,
  stripSlashes
} = require('./util');

const {
  sortByString,
} = require('./array-operations');

const {
  getPathExtname,
} = require('./file-operations');

const chalk = require('chalk');
const { data } = require('cheerio/lib/api/attributes');

const debug = require('debug')('app:http-operations');
const isDebug = false;

/**
 * @method urlExists
 * @async
 * 
 * @param {String} target 
 * @returns {Boolean|Error}
 */
const urlExists = async function (target) {
  let uri;
  try {
    uri = url.parse(target);
  } catch (error) {
    logger.error(`Invalid url ${target}`);
    throw new Error(`Invalid url ${target}`);
  }

  try {
    await axios.get(uri);
    return true;
  } catch (error) {
    logger.error(`This URL "${target}" does not exist`);
    if (isDebug && error.code) console.log('http-operations.checkExistUrl.error.code:', error.code);
    if (isDebug && error.config) inspector('http-operations.checkExistUrl.error.config:', error.config);
    if (isDebug && error.headers) inspector('http-operations.checkExistUrl.error.headers:', error.headers);
    if (error.response) {
      // Request made and server responded
      if (isDebug && error.response) inspector('http-operations.checkExistUrl.error.response.status:', error.response.status);
      if (isDebug && error.response) inspector('http-operations.checkExistUrl.error.response.data:', error.response.data);
      if (isDebug && error.response) inspector('http-operations.checkExistUrl.error.response.headers:', error.response.headers);
    }
    throw error;
  }
};

/**
 * @method isUrlExists
 * @async
 * 
 * @param {String} url 
 * @param {Boolean} showMsg 
 * @returns {Boolean}
 */
const isUrlExists = async function (url, showMsg = false) {
  try {
    await urlExists(url);
    return true;
  } catch (error) {
    if (showMsg) logger.error(`This URL "${url}" does not exist`);
    return false;
  }
};


/**
 * @method httpGetNewFileFromDir
 * @param {String} url 
 * @returns {Object}
 */
const httpGetNewFileFromDir = async function (url) {
  let result = null;
  //-----------------------
  // Get fileNames from target 
  url = stripSlashes(url);
  try {
    await urlExists(url);
    let response = await axios.get(url);
    let data = response.data;
    const $ = cheerio.load(data);
    let filenames = [];
    $('pre a').each(function () {
      filenames.push($(this).text());
    });
    filenames = filenames.filter(item => !(item.includes('[') && item.includes(']')));
    filenames = sortByString(filenames, false);
    if (true && filenames.length) inspector('httpGetLastFileFromDir.filenames:', filenames);
    // inspector('httpGetLastFileFromDir.filenames:', filenames);
    // Get content from last file
    if (filenames.length) {
      url = `${url}/${filenames[0]}`;
      response = await axios.get(url);
      data = response.data;
      if (true && data) inspector(`httpGetLastFileFromDir (${filenames[0]}):`, data);
      // inspector(`HttpOperations: get data from file (${filenames[0]}):`, dataItems);
      result = { name: filenames[0], data };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return result;
};

/**
 * @method httpGetFileNamesFromDir
 * @param {String} url 
 * @param {String[]} fileList 
 * @returns {Object}
 * e.g. [
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/2022/2022-01/DayHist01_23F120_01022022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02232022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02242022_0000.xls'
]
 */
const httpGetFileNamesFromDir = async function (url, fileList = []) {
  let result = null;
  //-----------------------
  // Get fileNames from url 
  url = stripSlashes(url);
  try {
    await urlExists(url);
    let response = await axios.get(url);
    let data = response.data;
    const $ = cheerio.load(data);
    let filenames = [];
    $('pre a').each(function () {
      filenames.push($(this).text());
    });
    if (isDebug && filenames.length) inspector('httpGetFileNamesFromDir.filenames:', filenames);
    filenames = filenames.filter(item => !(item.includes('[') && item.includes(']')));
    filenames = sortByString(filenames, true);
    if (isDebug && filenames.length) inspector('httpGetFileNamesFromDir.filter.filenames:', filenames);

    for (let index = 0; index < filenames.length; index++) {
      const item = filenames[index];
      const extname = getPathExtname(item);
      if (extname) {
        fileList.push(`${url}/${item}`);
      } else {
        await httpGetFileNamesFromDir(`${url}/${item}`, fileList);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return fileList;
};

/**
 * @method httpGetFileFromUrl
 * @param {Object} params 
 * e.g. {
  url: 'http://bit.ly/2mTM3nY', 
  method: 'get',
  responseType: 'stream'
}
`url` is the server URL that will be used for the request
e.g.  url: '/user',
`method` is the request method to be used when making the request
options are -> axios#create([config]); axios#request(config); axios#get(url[, config]); axios#delete(url[, config]); axios#head(url[, config]); 
axios#options(url[, config]); axios#post(url[, data[, config]]); axios#put(url[, data[, config]]); axios#patch(url[, data[, config]])
e.g. method: 'get', // default
`responseType` indicates the type of data that the server will respond with
options are -> 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
e.g. responseType: 'json', // default
e.g. responseType: 'stream' -> response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
 * @returns {Object}
 */
const httpGetFileFromUrl = async function (params = {}) {
  let result = null, response, url;
  //-----------------------
  try {
    // Get url
    params.url = stripSlashes(params.url);
    await urlExists(params.url);
    // Get data
    response = await axios(params);
    result = response.data;
    // if (true && data) inspector(`httpGetLastFileFromDir (${filenames[0]}):`, data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return result;
};

/**
 // GET request for remote image
axios({
  method: 'get',
  url: 'http://bit.ly/2mTM3nY',
  responseType: 'stream'
})
  .then(function(response) {
  response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
}); 
 */

module.exports = {
  urlExists,
  isUrlExists,
  httpGetNewFileFromDir,
  httpGetFileNamesFromDir,
  httpGetFileFromUrl
};
