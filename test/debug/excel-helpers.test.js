/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRandom = require('lodash/random');
const loStartsWith = require('lodash/startsWith');
const loForEach = require('lodash/forEach');
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
  ExceljsHelperClass,
} = require('../../src/plugins/excel-helpers');

const chalk = require('chalk');

const debug = require('debug')('app:excel-helpers.test');
const isDebug = false;
const isDebug_1 = false;
const isDebug_2 = false;

const xlsFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/DayReport-CH_M52_ACM.xls';
const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/DayReport-CH_M52_ACM.xlsx';
const xlsxFile2 = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/YearReport-CH_M52_ACM.xlsx';
const csvFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/data-CH_M51.csv';

// Sample data set
let student_data = [{
  Student: 'Nikhil',
  Age: loRandom(17, 50),
  Branch: 'ISE',
  Marks: loRandom(50, 100)
},
{
  Student: 'Amitha',
  Age: loRandom(17, 50),
  Branch: 'EC',
  Marks: loRandom(50, 100)
}];

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
    let resultPath = '', jsonData, jsonData2;
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
    jsonData2 = xlsx.readFile(resultPath, 'Report1').sheetToJson();
    assert.ok(jsonData.length === jsonData2.length, 'Write data to xls file');
  });

  it('#3: Get cells from xlsx file', async () => {
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile2],
      sheetName: 'Data_CNBB'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const cells = exceljs.getCells(sheetName);

    assert.ok(cells.length, 'Get cells from xlsx file');
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      const col = cell.address2.col;
      const row = cell.address2.row;
      if (isDebug_2 && col === 'B' && (row >= 6 && row <= 29)) {
        inspector('xlsx.cell:', loOmit(cell, ['cell', 'column', 'row']));
      }
    }
  });

  it('#4: Get cells from csv data', async () => {
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      csvPath: [appRoot, csvFile],
      csvOptions: {
        sheetName: 'TagValues',
        parserOptions: {
          delimiter: ';'
        },
      }
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const cells = exceljs.getCells(sheetName);

    assert.ok(cells.length, 'Get cells from json data');
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      const col = cell.address2.col;
      const row = cell.address2.row;
      if (isDebug && col === 'A') {
        inspector('xlsx.cell:', loOmit(cell, ['cell', 'column', 'row']));
      }
    }
  });

  it('#5: Get row cells from xlsx file', async () => {
    let cell;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getRowCells(sheetName, { header: 1 });
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug) inspector('#5: Get row cells from xlsx file.rowCells:', items);
    // inspector('#5: Get row cells from xlsx file.rowCells:', items);
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (Array.isArray(item)) {
        for (let index2 = 0; index2 < item.length; index2++) {
          if (!item[index2]) continue;
          cell = item[index2];
          const col = cell.address2.col;
          const row = cell.address2.row;
          if (isDebug && (row >= 1 && row <= 2)) {
            inspector('xlsx.cell:', cell);
          }
        }
      } else {
        loForEach(item, function (cell, key) {
          const col = cell.address2.col;
          const row = cell.address2.row;
          if (isDebug && (row >= 1 && row <= 5)) {
            inspector('xlsx.cell:', cell);
          }
        });
      }
    }
  });

  it('#6: Get row values from xlsx file', async () => {
    let cellValue;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getRowValues(sheetName, { header: '' });
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug) inspector('#6: Get row values from xlsx file.rowCells:', items);
    // inspector('#6: Get row values from xlsx file.rowCells:', items);
    for (let rowIndex = 0; rowIndex < items.length; rowIndex++) {
      const item = items[rowIndex];
      if (Array.isArray(item)) {
        for (let colIndex = 0; colIndex < item.length; colIndex++) {
          if (!item[colIndex]) continue;
          cellValue = item[colIndex];
          if (isDebug && (rowIndex >= 1 && rowIndex <= 2)) {
            inspector('xlsx.cell.value:', cellValue);
          }
        }
      } else {
        loForEach(item, function (value, key) {
          if (isDebug && (rowIndex >= 1 && rowIndex <= 5)) {
            inspector('xlsx.cell.value:', { [key]: value });
          }
        });
      }
    }
  });

  it('#7: Get column cells from xlsx file', async () => {
    let cell;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getColumnCells(sheetName, { header: 'A' });
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug) inspector('#7: Get column cells from xlsx file.columnCells:', items);
    // inspector('#7: Get column cells from xlsx file.columnCells:', items);
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (Array.isArray(item)) {
        for (let index2 = 0; index2 < item.length; index2++) {
          if (!item[index2]) continue;
          cell = item[index2];
          const col = cell.address3.col;
          const row = cell.address3.row;
          if (isDebug && (col >= 1 && col <= 2)) {
            inspector('xlsx.cell:', cell);
          }
        }
      } else {
        loForEach(item, function (cell, key) {
          const col = cell.address2.col;
          const row = cell.address2.row;
          if (isDebug && (col >= 1 && col <= 5)) {
            inspector('xlsx.cell:', cell);
          }
        });
      }
    }
  });

  it('#8: Get column values from xlsx file', async () => {
    let cellValue;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getColumnValues(sheetName, { header: 1 });
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug) inspector('#8: Get column values from xlsx file.columnValues:', items);
    inspector('#8: Get column values from xlsx file.columnValues:', items);
    for (let colIndex = 0; colIndex < items.length; colIndex++) {
      const item = items[colIndex];
      if (Array.isArray(item)) {
        for (let rowIndex = 0; rowIndex < item.length; rowIndex++) {
          if (!item[rowIndex]) continue;
          cellValue = item[rowIndex];
          if (isDebug && (colIndex >= 1 && colIndex <= 2)) {
            inspector('xlsx.cell.value:', cellValue);
          }
        }
      } else {
        loForEach(item, function (value, key) {
          if (isDebug && (colIndex >= 1 && colIndex <= 5)) {
            inspector('xlsx.cell.value:', { [key]: value });
          }
        });
      }
    }
  });
});
