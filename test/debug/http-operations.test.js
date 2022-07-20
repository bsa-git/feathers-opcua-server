/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const axios = require('axios');
const cheerio = require('cheerio');
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
  getRangeStartEndOfPeriod
} = require('../../src/plugins');

const {
  urlExists,
  checkStatusFetch
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


  it('#1: HttpOperations: https.get', async () => {
    const https = require('https');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    try {
      await urlExists(url);
      https.get(url, res => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', data => {
          body += data;
        });
        res.on('end', () => {
          body = JSON.parse(body);
          console.log(body);
        });
      });
      assert.ok(true, 'HttpOperations: https.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: https.get');
    }
  });

  it('#2: HttpOperations: axios.get', async () => {
    const url = 'https://jsonplaceholder.typicode.com/posts/2';
    try {
      await urlExists(url);
      const getData = async url => {
        try {
          const response = await axios.get(url);
          const data = response.data;
          console.log(data);
        } catch (error) {
          console.log(error);
        }
      };

      await getData(url);
      assert.ok(true, 'HttpOperations: axios.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: axios.get');
    }
  });

  it('#3: HttpOperations: fetch.get', async () => {
    const fetch = require('node-fetch');
    const url = 'https://jsonplaceholder.typicode.com/users';
    try {
      await urlExists(url);
      fetch(url)
        .then(res => res.json())
        .then(json => {
          console.log('First user in the array:');
          console.log(json[0]);
          console.log('Name of the first user in the array:');
          console.log(json[0].name);
        });
      assert.ok(true, 'HttpOperations: fetch.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: fetch.get');
    }
  });

  it('#4: HttpOperations: get data from new file', async () => {
    let url = 'http://192.168.3.5/www_m5/m5_data2/';
    let dataItems = null;
    try {
      await urlExists(url);
      const getData = async url => {
        try {
          const file = await httpGetNewFileFromDir(url);
          let result = papa.parse(file.data, { delimiter: ';', header: true });
          result = result.data[0];
          dataItems = {};
          loForEach(result, (value, key) => {
            dataItems[key] = getFloat(value);
          });
          if (isDebug) inspector(`HttpOperations: get data from new file (${file.name}):`, dataItems);
          // inspector(`HttpOperations: get data from file (${file.name}):`, dataItems);
          return dataItems;
        } catch (error) {
          console.log(error);
          assert.ok(false, 'HttpOperations: get data from new file');
        }
      };
      await getData(url);
      assert.ok(true, 'HttpOperations: get data from new file');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: get data from new file');
    }
  });

  it('#5: HttpOperations: get file names from dir', async () => {
    let url = 'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/';
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    try {
      await urlExists(url);
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
      if (true && fileNames.length) inspector(`HttpOperations: get file names from dir (${url}):`, fileNames);
      filterFileNames = await getFileNames(url, '*/**/2022/**/*.xls', { matchBase: true });
      if (true && filterFileNames.length) inspector(`HttpOperations: get file names from dir (${url}):`, filterFileNames);
      assert.ok(fileNames.length >= filterFileNames.length, 'HttpOperations: get file names from dir');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: get file names from dir');
    }
  });

  it('#6: HttpOperations: get file names from dir. With glob patterns to include/exclude files', async () => {
    let host = 'http://192.168.3.5', url = `${host}/www_m5/day_reports/m5-1/ACM/23AGR/`;
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    try {
      await urlExists(url);
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
      rangeYears = rangeYears.map(year => `*/**/*${ year }_*.*`);
      // e.g. ['*/**/*2018_*.*', '*/**/*2019_*.*', '*/**/*2020_*.*', '*/**/*2021_*.*', '*/**/*2022_*.*']
      if(isDebug && rangeYears) debug('getRangeStartEndOfPeriod.range:', rangeYears);
      filterFileNames = fileNames.filter(filePath => createMatch(
        // ['*/**/*.*'],   // patterns to include
        rangeYears, // patterns to include
        ['*/**/*.xlk']  // patterns to exclude
      )(filePath));
      if (isDebug && filterFileNames.length) inspector(`HttpOperations: get filterFileNames from dir (${url}):`, filterFileNames);

      // filterFileNames = await getFileNames(url, 'http://192.168.3.5/**/2022/**/*.xls', { matchBase: true });
      assert.ok(fileNames.length >= filterFileNames.length, 'HttpOperations: get file names from dir. With glob patterns to include/exclude files');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(false, 'HttpOperations: get file names from dir. With glob patterns to include/exclude files');
    }
  });
});
