/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRandom = require('lodash/random');
const loStartsWith = require('lodash/startsWith');
const loForEach = require('lodash/forEach');
const loIsNumber = require('lodash/isNumber');
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
    // removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m52_acm']);
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
      if (isDebug && loStartsWith(cell.address, 'C')) {
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
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const cells = exceljs.getCells(sheetName, { range: 'G11:K11' });
    assert.ok(cells.length, 'Get cells from xlsx file');

    loForEach(cells, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (isDebug && cell) inspector(`#3: Get cells from xlsx file.cell(${cell.address}):`, cell);
    });
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
    const cells = exceljs.getCells(sheetName, { range: 'A1:D2' });
    assert.ok(cells.length, 'Get cells from json data');

    loForEach(cells, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (isDebug && cell) inspector(`#4: Get cells from csv data.cell(${cell.address}):`, cell);
    });
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
    const items = exceljs.getRowCells(sheetName, { header: 'A', range: 'A1:K11' });
    assert.ok(items.length, 'Get row cells from xlsx data');

    loForEach(items, function (item, rowIndex) {
      if (Array.isArray(item)) {
        loForEach(item, function (cell, colIndex) {
          cell = loOmit(cell, ['cell', 'column', 'row']);
          if (isDebug && cell) inspector(`#5: Get row cells from xlsx file.cell_(${cell.address}):`, cell);
        });
      } else {
        loForEach(item, function (cell, key) {
          cell = loOmit(cell, ['cell', 'column', 'row']);
          if (isDebug && cell) inspector(`#5: Get row cells from xlsx file.cell_(${cell.address}):`, cell);
        });
      }
    });
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
    const items = exceljs.getRowValues(sheetName, { header: 'A', range: 'B11:K15' });
    if (isDebug && items.length) inspector('#6: Get row values from xlsx file.rowCells:', items);
    assert.ok(items.length, 'Get row cells from xlsx data');

    loForEach(items, function (item, rowIndex) {
      if (Array.isArray(item)) {
        loForEach(item, function (value, colIndex) {
          if (isDebug && value !== undefined) inspector(`#6: Get row values from xlsx file.cell_(col:${colIndex}, row:${rowIndex}):`, value);
        });
      } else {
        loForEach(item, function (value, key) {
          if (isDebug && value !== undefined) inspector(`#6: Get row values from xlsx file.cell_(col:${key}, row:${rowIndex}):`, value);
        });
      }
    });
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
    const items = exceljs.getColumnCells(sheetName, { header: 'A', range: 'A1:K11' });
    assert.ok(items.length, 'Get row cells from xlsx data');
    
    loForEach(items, function (item) {
      if (Array.isArray(item)) {
        loForEach(item, function (cell) {
          cell = loOmit(cell, ['cell', 'column', 'row']);
          if (isDebug && cell) inspector(`#7: Get column cells from xlsx file.cell_(${cell.address}):`, cell);
        });
      } else {
        loForEach(item, function (cell, key) {
          cell = loOmit(cell, ['cell', 'column', 'row']);
          if (isDebug && cell) inspector(`#7: Get column cells from xlsx file.cell_(${cell.address}):`, cell);
        });
      }
    });
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
    const items = exceljs.getColumnValues(sheetName, { header: 'A', range: 'A1:K11' });
    if (isDebug && items.length) inspector('#8: Get column values from xlsx file.columnValues:', items);
    assert.ok(items.length, 'Get row cells from xlsx data');
    
    loForEach(items, function (item, colIndex) {
      if (Array.isArray(item)) {
        loForEach(item, function (value, rowIndex) {
          if (isDebug && value !== undefined) inspector(`#8: Get column values from xlsx file.cell_(col:${colIndex}, row:${rowIndex}):`, value);
        });
      } else {
        loForEach(item, function (value, key) {
          if (isDebug && value !== undefined) inspector(`#8: Get column values from xlsx file.cell_(col:${colIndex}, row:${key}):`, value);
        });
      }
    });
  });

  it('#9: Write data to xlsx file', async () => {
    let resultPath = '';
    //-------------------------

    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    let sheetName = exceljs.getSheet().name;
    let items = exceljs.getRowValues(sheetName, { header: 1 });
    let items2 = exceljs.getColumnValues(sheetName, { header: 1 });
    // inspector('#9: Write data to xlsx file.items:', items);
    assert.ok(items.length && items2.length, 'Write data to xlsx file');


    // Create exceljs object
    exceljs = new ExceljsHelperClass({
      sheetName: 'TmpReport1',
      bookOptions: {
        creator: 'Me',
        lastModifiedBy: 'Her',
        created: new Date(1985, 8, 30),
        modified: new Date(),
        lastPrinted: new Date(2016, 9, 27),
        date1904: true,
        fullCalcOnLoad: true
      }
    });

    await exceljs.init();
    exceljs.addSheet('TmpReport2', {
      properties: { tabColor: { argb: 'FFC0000' } },
      views: [{ showGridLines: false }]
    });
    sheetName = exceljs.getSheet().name;
    if (isDebug) console.log('worksheet.Report1.sheetName:', sheetName, '; bookOptions.lastPrinted:', exceljs.workbook.lastPrinted);
    // Add row values
    for (let rowIndex = 1; rowIndex <= items.length; rowIndex++) {
      let item = items[rowIndex] ? items[rowIndex] : [];
      exceljs.addRow(item);
    }
    // Add column values
    for (let colIndex = 1; colIndex <= items2.length; colIndex++) {
      let item = items2[colIndex] ? items2[colIndex] : [];
      if (colIndex === 3 || colIndex === 4 || colIndex === 6) {// colIndex = 3,4,6 -> 'C','D','F'
        item = item.map((v, rowIndex) => {// rowIndex -> 11..34
          if (rowIndex >= 11 && rowIndex <= 34) {
            v = colIndex === 6 ? loRandom(50000, 500000) : loRandom(300, 2000);
          }
          return v;
        });
      }
      exceljs.addColumnValues(item, colIndex, 'TmpReport2');
    }

    // Write new data to xlsx file
    const fileName = getFileName('DayReport1-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/ch-m52_acm', fileName]);
    // console.log('writeFile.resultPath:', resultPath);

    // Create exceljs object
    exceljs = new ExceljsHelperClass({
      excelPath: resultPath,
      sheetName: 'TmpReport1'
    });

    await exceljs.init();
    sheetName = exceljs.getSheet().name;
    const resultItems = exceljs.getRowValues(sheetName, { header: 1 });
    const resultItems2 = exceljs.getColumnValues('TmpReport2', { header: 1 });
    assert.ok(items.length === resultItems.length, 'Write data to xlsx file');
    assert.ok(items2.length === resultItems2.length, 'Write data to xlsx file');
  });
});
