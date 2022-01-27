/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');
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
const isDebug_1 = false;
const isDebug_2 = true;

const xlsFile = '/src/api/opcua/ua-cherkassy-azot_test2/DayReport-CH_M52_ACM.xls';
const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/YearReport-CH_M52_ACM.xlsx';
// const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/DayReport-CH_M52_ACM.xlsx';

describe('<<=== ExcelOperations: (excel-helpers.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: Get cells from xls file', async () => {
    const cells = xlsxGetCellsFromFile([appRoot, xlsFile], 'Report1');
    assert.ok(cells.length, 'Get cells from xls file');
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (isDebug_1 && loStartsWith(cell.address, 'A')) {
        inspector('xls.cell:', loOmit(cell, ['xlsx', 'workbook', 'worksheet', 'cell']));
      }      
    }
  });

  it('#2: Get cells from xlsx file', async () => {
    const cells = await exeljsGetCellsFromFile([appRoot, xlsxFile], 'Данi_СНВВ');
    // const cells = await exeljsGetCellsFromFile([appRoot, xlsxFile], 'Report1');
    assert.ok(cells.length, 'Get cells from xlsx file');
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      const col = cell.oAddress.col;
      const row = cell.oAddress.row;
      if (isDebug_2 && col === 'B' && (row >= 6 && row <= 29)) {  
        inspector('xlsx.cell:', loOmit(cell, ['cell', 'column', 'row']));// 22.02.2022  6:00:06
      }
    }
  });
});
