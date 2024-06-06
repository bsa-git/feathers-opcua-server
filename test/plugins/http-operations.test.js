/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const host = app.get('host');
const port = app.get('port');
const fetch = require('node-fetch');
const { curly } = require('node-libcurl');
const chalk = require('chalk');
const papa = require('papaparse');
const moment = require('moment');
const shouldProxy = require('should-proxy');
const axios = require('axios');

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
  getParseUrl,
} = require('../../src/plugins');

const {
  getHttp,
  reqHttp,
  getHttps,
  reqHttps,
  isUrlExists
} = require('../../src/plugins/lib/http-operations');

const loForEach = require('lodash/forEach');

const debug = require('debug')('app:http-operations.test');
const isDebug = false;

const envNoProxy = process.env.no_proxy;
if(true && envNoProxy) console.log('envNoProxy:', envNoProxy);


let hostname = getParseUrl('http://192.168.3.5:3030').hostname;
let isProxy = shouldProxy(`http://${hostname}`, { no_proxy: envNoProxy });
console.log('proxy_url-1.1:', `"http://${hostname}"`, `(${isProxy})`);
hostname = getParseUrl(`http://${host}:${port}`).hostname;
isProxy = shouldProxy(`http://${hostname}/my/1234`, { no_proxy: envNoProxy });
console.log('proxy_url-1.2:', `"http://${hostname}"`, `(${isProxy})`);
hostname = getParseUrl('http://zf2-asm.srv2').hostname;
isProxy = shouldProxy(`http://${hostname}`, { no_proxy: envNoProxy });
console.log('proxy_url-1.3:', `"http://${hostname}"`,  `(${isProxy})`);
hostname = getParseUrl('https://jsonplaceholder.typicode.com/posts/1').hostname;
isProxy = shouldProxy(`http://${hostname}`, { no_proxy: envNoProxy });
console.log('proxy_url-2.1:', `"http://${hostname}"`, `(${isProxy})`);
hostname = getParseUrl('http://www.google.com').hostname;
isProxy = shouldProxy(`http://${hostname}`, { no_proxy: envNoProxy });
console.log('proxy_url-2.2:', `"http://${hostname}"`, `(${isProxy})`);

// const localAddress = getLocalIpAddress();
// inspector('localAddress:', localAddress);

describe('<<=== HttpOperations: (http-operations.test) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });


  it('#1.1: HttpOperations: curly.get("http://${host}:${port}")', async () => {
    const url = `http://${host}:${port}`;
    if (! await isUrlExists(url)) return;

    const { statusCode, data, headers } = await curly.get(`http://${host}:${port}`);

    if (statusCode && isDebug) console.log(`curly.get(${url}).statusCode:`, statusCode);
    if (data && isDebug) inspector(`curly.get(${url})`, data);
    assert.ok(statusCode === 200, 'HttpOperations: curly.get("localhost")');
  });

  it('#1.2: HttpOperations: axios.get("http://${host}:${port}")', async () => {
    const url = `http://${host}:${port}`;
    if (! await isUrlExists(url)) return;

    const response = await axios.get(url);
    if (isDebug && response) console.log(`axios.get(${url}).statusText`, response.statusText);
    assert.ok(response, 'HttpOperations: axios.get');
  });

  it('#2.1: HttpOperations: https.get("http://nodejs.org/dist/index.json")', async () => {
    let data, url = 'http://nodejs.org/dist/index.json';
    //------------------------------------------------------
    
    // External address
    if (! await isUrlExists(url)) return;

    data = await getHttps(url);
    if(isDebug && data) console.log('getHttps.data:', JSON.parse(data));
    assert.ok(data, `HttpOperations: getHttps("${url}")`);

    // Local address
    url = 'http://192.168.3.5/www_m5/m5_data/';
    if (! await isUrlExists(url)) return;

    data = await getHttp(url);
    if(isDebug && data) console.log('getHttp.data:', data);
    assert.ok(data, `HttpOperations: getHttp("${url}")`);
  });

  it('#2.2: HttpOperations: http.request("https://jsonplaceholder.typicode.com/posts/2")', async () => {
    let data, url = 'https://jsonplaceholder.typicode.com/posts/2';
    //------------------------------------------------------------------------
    
    // External address
    if (! await isUrlExists(url)) return;

    data = await reqHttps(url);
    data = JSON.parse(data);
    if(isDebug && data) console.log('getHttps.data:', data);
    assert.ok(data.userId, `HttpOperations: http.request("${url}")`);

    // Local address
    url = 'http://192.168.3.5/www_m5/m5_data2/';
    if (! await isUrlExists(url)) return;

    data = await reqHttp(url);
    if(isDebug && data) console.log('reqHttp.data:', data);
    assert.ok(data, `HttpOperations: reqHttp("${url}")`);
  });

  
  it('#3: HttpOperations: https.get("https://jsonplaceholder.typicode.com/posts/1")', async () => {
    let data, url = 'https://jsonplaceholder.typicode.com/posts/1';
    if (! await isUrlExists(url)) return;

    data = await getHttps(url);
    data = JSON.parse(data);
    if(isDebug && data) console.log('getHttps.data:', data);
    assert.ok(data.userId, 'HttpOperations: https.get("https://jsonplaceholder.typicode.com/posts/1")');
  });

  
  it('#4: HttpOperations: fetch.get("https://jsonplaceholder.typicode.com/users")', async () => {

    const url = 'https://jsonplaceholder.typicode.com/users';
    if (! await isUrlExists(url, true)) return;

    const response = await fetch(url);
    let data = await response.json();
    data = data[0];
    if (isDebug && data) inspector(`fetch.get(${url})`, data);
    assert.ok(data.id, `HttpOperations: fetch.get("${url}")`);
  });

  
  it('#5: HttpOperations: curly.get("http://www.google.com")', async () => {
    const url = 'http://www.google.com';
    if (! await isUrlExists(url, true)) return;

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
