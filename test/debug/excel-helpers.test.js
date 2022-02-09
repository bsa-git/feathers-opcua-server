/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRandom = require('lodash/random');
const loStartsWith = require('lodash/startsWith');
const assert = require('assert');
const app = require('../../src/app');

const {
  appRoot,
  inspector,
  startListenPort,
  stopListenPort,
  makeDirSync,
  removeFilesFromDirSync,
  getFileName
} = require('../../src/plugins');

const {
  XlsxHelperClass,
  xlsxReadFile,
  xlsxWriteFile,
  xlsxGetCells,
  xlsxCreateBook,
  xlsxJsonToSheet,
  xlsxSheetToJson,
  xlsxBookAppendSheet,
  exeljsReadFile,
  exeljsWriteFile,
  exeljsGetCells,
} = require('../../src/plugins/excel-helpers');

const chalk = require('chalk');

const debug = require('debug')('app:excel-helpers.test');
const isDebug_1 = false;
const isDebug_2 = false;

const xlsFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/DayReport-CH_M52_ACM.xls';
const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/YearReport-CH_M52_ACM.xlsx';

describe('<<=== ExcelOperations: (excel-helpers.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
    makeDirSync([appRoot, 'test/data/tmp/ch-m52_acm']);
  });

  after(function (done) {
    stopListenPort(done);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m52_acm']);
  });

  it('#1: Get cells from xls file', async () => {
    
    const xlsx = new XlsxHelperClass({
      excelPath: [appRoot, xlsFile],
      sheetName: 'Report1'
    });

    const cells = xlsx.getCells('Report1');
    assert.ok(cells.length, 'Get cells from xls file');

    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (isDebug_1 && loStartsWith(cell.address, 'C')) {
        inspector('xls.cell:', loOmit(cell, ['xlsx', 'workbook', 'worksheet', 'cell']));
      }
    }
  });

  it('#2: Write data to xls file', async () => {
    let resultPath = '', jsonData;
    //-------------------------
    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: [appRoot, xlsFile],
      sheetName: 'Report1'
    });

    // Sheet to json
    jsonData = xlsx.sheetToJson();
    // Map  jsonData   
    jsonData = jsonData.map(row => {
      if (row['J']) {
        row['B'] = loRandom(300, 2000);
        row['D'] = loRandom(30000, 300000);
      }
      return row;
    });

    if (isDebug_1) console.log('worksheet.Report1.jsonData:', jsonData);

    // Create xlsx object
    xlsx = new XlsxHelperClass({
      jsonData,
      sheetName: 'Report1'
    });
    
    // Write new data to xls file
    const fileName = getFileName('DayHist01_14F120-', 'xls', true);
    resultPath = xlsx.writeFile([appRoot, 'test/data/tmp/ch-m52_acm', fileName]);
    assert.ok(resultPath, 'Write data to xls file');
  });

  it('#3: Get cells from xlsx file', async () => {
    const workbook = await exeljsReadFile([appRoot, xlsxFile]);
    const cells = exeljsGetCells(workbook, 'Данi_СНВВ');
    // const cells = await exeljsGetCellsFromFile([appRoot, xlsxFile], 'Report1');
    assert.ok(cells.length, 'Get cells from xlsx file');
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      const col = cell.address2.col;
      const row = cell.address2.row;
      if (isDebug_2 && col === 'B' && (row >= 6 && row <= 29)) {
        inspector('xlsx.cell:', loOmit(cell, ['cell', 'column', 'row']));// 22.02.2022  6:00:06
      }
    }
  });
});
