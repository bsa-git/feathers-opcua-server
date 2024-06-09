/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
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
  getRangeStartEndOfPeriod,
} = require('../../src/plugins');

const {
  isUrlExists
} = require('../../src/plugins/lib/http-operations');

const loForEach = require('lodash/forEach');

const isDebug = false;


describe('<<=== HttpHelpers: (http-helpers.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

    
  it('#1: HttpOperations: get data from new file', async () => {
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

  it('#2: HttpOperations: get file names from dir', async () => {
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

  it('#3: HttpOperations: get file names from dir. With glob patterns to include/exclude files', async () => {
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
