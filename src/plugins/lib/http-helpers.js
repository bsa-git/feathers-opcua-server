/* eslint-disable no-unused-vars */
const axios = require('axios');
const cheerio = require('cheerio');
var minimatch = require('minimatch');

const {
  inspector,
  stripSlashes,
} = require('./util');

const {
  urlExists
} = require('./http-operations');

const {
  sortByString,
} = require('./array-operations');

const {
  getPathExtname,
} = require('./file-operations');

const chalk = require('chalk');

const isDebug = false;


//=============================================================================

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
    if (isDebug && filenames.length) inspector('httpGetLastFileFromDir.filenames:', filenames);
    // Get content from last file
    if (filenames.length) {
      url = `${url}/${filenames[0]}`;
      response = await axios.get(url);
      data = response.data;
      if (isDebug && data) inspector(`httpGetLastFileFromDir (${filenames[0]}):`, data);
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
 * @param {String} pattern 
 * e.g. '*.xls'
 * @param {Object} options
 * e.g. { matchBase: true }
 * @param {String[]} fileList 
 * @returns {String[]}
 * e.g. [
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/2022/2022-01/DayHist01_23F120_01022022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02232022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02242022_0000.xls'
]
 */
const httpGetFileNamesFromDir = async function (url, pattern = '', options = {}, fileList = []) {
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
        await httpGetFileNamesFromDir(`${url}/${item}`, pattern, options, fileList);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileNamesFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileNamesFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  if (isDebug && fileList.length) inspector('httpGetFileNamesFromDir.fileList:', fileList);
  if (pattern) {
    fileList = minimatch.match(fileList, pattern, options);
    if (isDebug && fileList.length) inspector('httpGetFileNamesFromDir.minimatch.fileList:', fileList);
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
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileFromUrl.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileFromUrl.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return result;
};

module.exports = {
  httpGetNewFileFromDir,
  httpGetFileNamesFromDir,
  httpGetFileFromUrl
};
