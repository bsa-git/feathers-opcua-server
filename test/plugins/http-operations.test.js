/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const host = app.get('host');
const port = app.get('port');
const axios = require('axios');
const fetch = require('node-fetch');
const https = require('https');
const { curly } = require('node-libcurl');
const chalk = require('chalk');
const papa = require('papaparse');
const moment = require('moment');

const {
  inspector,
  startListenPort,
  stopListenPort,
  httpGetNewFileFromDir,
  httpGetFileNamesFromDir,
  createMatch,
  getFloat,
  canTestRun,
  getPathBasename,
  getRangeStartEndOfPeriod,
  getMyIp
} = require('../../src/plugins');

const {
  urlExists,
  isUrlExists
} = require('../../src/plugins/lib/http-operations');

const loForEach = require('lodash/forEach');

const debug = require('debug')('app:http-operations.test');
const isDebug = false;

describe('<<=== HttpOperations: (http-operations.test) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });


  it('#1: HttpOperations: curly.get("localhost")', async () => {
    const url = `http://${host}:${port}`;

    const { statusCode, data, headers } = await curly.get(`http://${host}:${port}`);

    // if (! await isUrlExists(url)) return;
    if (true && statusCode) console.log(`curly.get(${url}).statusCode:`, statusCode);
    if (isDebug && data) inspector(`curly.get(${url})`, data);
    assert.ok(statusCode === 200, 'HttpOperations: curly.get("localhost")');
  });

  it('#2: HttpOperations: https.get', async () => {

    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    if (! await isUrlExists(url)) return;

    https.get(url, res => {
      res.setEncoding('utf8');
      let body = '';

      res.on('data', data => {
        body += data;
      });

      res.on('end', () => {
        body = JSON.parse(body);
        if (isDebug && body) inspector(`https.get(${url})`, body);
      });
    });
    assert.ok(true, 'HttpOperations: https.get');
  });

  it('#3: HttpOperations: axios.get', async () => {
    const url = 'https://jsonplaceholder.typicode.com/posts/2';
    if (! await isUrlExists(url)) return;
    const response = await axios.get(url);
    const data = response.data;
    if (isDebug && data) inspector(`axios.get(${url})`, data);
    assert.ok(data, 'HttpOperations: axios.get');
  });

  it('#4: HttpOperations: fetch.get', async () => {

    const url = 'https://jsonplaceholder.typicode.com/users';
    if (! await isUrlExists(url)) return;

    const response = await fetch(url);
    const data = await response.json();
    if (isDebug && data) inspector(`fetch.get(${url})`, data[0]);
    assert.ok(data, 'HttpOperations: fetch.get');
  });

  it('#5: HttpOperations: curly.get', async () => {
    const url = 'http://www.google.com';
    if (! await isUrlExists(url)) return;

    const { statusCode, data, headers } = await curly.get(url);
    if (isDebug && statusCode) console.log(`curly.get(${url}).statusCode:`, statusCode);
    assert.ok(statusCode === 200, 'HttpOperations: curly.get');
  });


  it('#6: HttpOperations: get data from new file', async () => {
    let url = 'http://192.168.3.5/www_m5/m5_data2/';
    let dataItems = null;
    //------------------------
    if (! await isUrlExists(url)) return;

    try {
      const file = await httpGetNewFileFromDir(url);
      let result = papa.parse(file.data, { delimiter: ';', header: true });
      result = result.data[0];
      dataItems = {};
      loForEach(result, (value, key) => {
        dataItems[key] = getFloat(value);
      });
      if (isDebug && dataItems) inspector(`HttpOperations: get data from new file (${file.name}):`, dataItems);
      assert.ok(dataItems, 'HttpOperations: get data from new file');
    } catch (error) {
      console.log(error);
      assert.ok(false, 'HttpOperations: get data from new file');
    }
  });

  it('#7: HttpOperations: get file names from dir', async () => {
    let url = 'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/';
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    if (! await isUrlExists(url)) return;

    const getFileNames = async (url, pattern, options) => {
      try {
        const fileNames = await httpGetFileNamesFromDir(url, pattern, options);
        return fileNames;
      } catch (error) {
        console.log(error);
        assert.ok(false, 'HttpOperations: get file names from dir');
      }
    };
    fileNames = await getFileNames(url);
    if (isDebug && fileNames.length) inspector(`HttpOperations: get file names from dir (${url}):`, fileNames);
    filterFileNames = await getFileNames(url, '*/**/2022/**/*.xls', { matchBase: true });
    if (isDebug && filterFileNames.length) inspector(`HttpOperations: get file names from dir (${url}):`, filterFileNames);
    assert.ok(fileNames.length >= filterFileNames.length, 'HttpOperations: get file names from dir');
  });

  it('#8: HttpOperations: get file names from dir. With glob patterns to include/exclude files', async () => {
    let host = 'http://192.168.3.5', url = `${host}/www_m5/day_reports/m5-1/ACM/23AGR/`;
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    if (! await isUrlExists(url)) return;
    
    const getFileNames = async (url, pattern, options) => {
      try {
        const fileNames = await httpGetFileNamesFromDir(url, pattern, options);
        return fileNames;
      } catch (error) {
        console.log(error);
        assert.ok(false, 'HttpOperations: get file names from dir');
      }
    };
    fileNames = await getFileNames(url);
    if (isDebug && fileNames.length) inspector(`HttpOperations: get file names from dir (${url}):`, fileNames);
    // Get file paths with pattern filter
    const dateTime = moment.utc().subtract(4, 'years').format('YYYY-MM-DDTHH:mm:ss');
    let rangeYears = getRangeStartEndOfPeriod(dateTime, [5, 'years'], 'year');
    rangeYears = rangeYears.map(year => `*/**/*${year}_*.*`);
    // e.g. ['*/**/*2018_*.*', '*/**/*2019_*.*', '*/**/*2020_*.*', '*/**/*2021_*.*', '*/**/*2022_*.*']
    if (isDebug && rangeYears) debug('getRangeStartEndOfPeriod.range:', rangeYears);
    filterFileNames = fileNames.filter(filePath => createMatch(
      // ['*/**/*.*'],   // patterns to include
      rangeYears, // patterns to include
      ['*/**/*.xlk']  // patterns to exclude
    )(filePath));
    if (isDebug && filterFileNames.length) inspector(`HttpOperations: get filterFileNames from dir (${url}):`, filterFileNames);

    // filterFileNames = await getFileNames(url, 'http://192.168.3.5/**/2022/**/*.xls', { matchBase: true });
    assert.ok(fileNames.length >= filterFileNames.length, 'HttpOperations: get file names from dir. With glob patterns to include/exclude files');
  });
});
