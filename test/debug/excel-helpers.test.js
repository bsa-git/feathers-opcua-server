/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  appRoot,
  inspector,
  startListenPort, 
  stopListenPort,
} = require('../../src/plugins');

const {
  xlsxGetCellsFromFile,
  exeljsGetCellsFromFile 
} = require('../../src/plugins/excel-helpers');

const chalk = require('chalk');

const debug = require('debug')('app:excel-helpers.test');
const isDebug = false;
const isLog = false;

const xlsFile = '/src/api/opcua/ua-cherkassy-azot_test2/DayReport-CH_M52_ACM.xls';
const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/DayReport-CH_M52_ACM.xlsx';

describe('<<=== ExcelOperations: (excel-helpers.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: Get cells from xls file', async () => {
    const cells = xlsxGetCellsFromFile([appRoot, xlsFile], 'Report1');
    if(isLog) inspector('Get cells from xls file:', cells);
    // inspector('Get cells from xls file:', cells);
  });

  it('#2: Get cells from xlsx file', async () => {
    const cells = await exeljsGetCellsFromFile([appRoot, xlsxFile], 'Report1');
    if(isLog) inspector('Get cells from xlsx file:', cells);
    inspector('Get cells from xlsx file:', cells);
  });
});
