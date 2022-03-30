/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRandom = require('lodash/random');
const loRound = require('lodash/round');
const loStartsWith = require('lodash/startsWith');
const loForEach = require('lodash/forEach');
const loIsNumber = require('lodash/isNumber');
const assert = require('assert');
const app = require('../../src/app');

const {
  appRoot,
  inspector,
  rgbToARGB,
  hexToARGB,
  startListenPort,
  stopListenPort,
  makeDirSync,
  removeFilesFromDirSync,
  shiftRowRangeArray,
  shiftColRangeArray,
  convertRowRangeArray,
  getFileName,
  shiftTimeByOneHour
} = require('../../src/plugins');

const colors = require('../../src/plugins/lib/colors');

const {
  XlsxHelperClass,
  ExceljsHelperClass,
} = require('../../src/plugins/excel-helpers');

const chalk = require('chalk');
const moment = require('moment');
const Color = require('color');

const debug = require('debug')('app:excel-helpers.test');
const isDebug = false;

const xlsFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/DayReport-CH_M52_ACM.xls';
const xlsxFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/DayReport-CH_M52_ACM.xlsx';
const xlsxFile2 = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/acmYearTemplate.xlsx'; // acmYearTemplate Book1.xlsx
const xlsxFile3 = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/acmYearTemplate2.xlsx';
const csvFile = '/src/api/opcua/ua-cherkassy-azot_test2/test-data/data-CH_M51.csv';

// Colors for cells
const argbColors = {
  gray: rgbToARGB(166, 166, 166),
  red: rgbToARGB(150, 54, 52),
  rose: rgbToARGB(242, 220, 219)
};

// Rules for cells
const rulesForCells = {
  errorSign: [
    {
      type: 'cellIs',
      operator: 'equal',
      formulae: ['""'],
      style: { 
        fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: argbColors.gray } },
        border: {
          top: { style: 'thin', color: { argb: argbColors.red } },
          left: { style: 'thin', color: { argb: argbColors.red } },
          bottom: { style: 'thin', color: { argb: argbColors.red } },
          right: { style: 'thin', color: { argb: argbColors.red } }
        }
      }, 
    },
    {
      type: 'cellIs',
      operator: 'greaterThan',
      formulae: ['0'],
      style: { 
        fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: hexToARGB(colors.red.lighten4) } },
        font: {
          color: { argb: argbColors.red },
          bold: true,
          italic: true
        }
      }, 
    }
  ]
};


describe('<<=== ExcelOperations: (excel-helpers.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
    makeDirSync([appRoot, 'test/data/tmp/excel-helper']);
  });

  after(function (done) {
    stopListenPort(done);
    // removeFilesFromDirSync([appRoot, 'test/data/tmp/excel-helper']);
  });

  it('#1: Get cells from xls file "DayReport"', async () => {
    let cells;
    //---------------------------------
    const xlsx = new XlsxHelperClass({
      excelPath: [appRoot, xlsFile],
      sheetName: 'Report1'
    });

    cells = xlsx.getCells('Report1', { range: 'A11:J11' });
    assert.ok(cells.length, 'Get cells from xls file');

    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (isDebug && cell) inspector('#1: Get cells from xls file.cell:', loOmit(cell, ['xlsx', 'workbook', 'worksheet', 'cell']));
    }

    cells = xlsx.sheetToJson('Report1', { range: 'A11:J13' });
    if (isDebug && cells.length) inspector('#1: Get cells from xls file.cells:', cells);
  });

  it('#2: Write data to xls file "DayReport"', async () => {
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
    resultPath = xlsx.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);
    jsonData2 = xlsx.readFile(resultPath, 'Report1').sheetToJson();
    assert.ok(jsonData.length === jsonData2.length, 'Write data to xls file');
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

  it('#3: Get cells from xlsx file "DayReport"', async () => {
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

  it('#5: Get row cells from xlsx file "DayReport"', async () => {
    let cell;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getRowCells(sheetName, { header: 'A', range: 'A8:J11' });
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

  it('#6: Get row values from xlsx file "DayReport"', async () => {
    let cellValue;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const options = { header: 1, range: 'B11:D12' };
    const items = exceljs.getRowValues(sheetName, options);
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug && items.length) inspector('#6: Get row values from xlsx file.rowCells:', items);
    if (options.header === 1) {
      const shiftItems = shiftRowRangeArray(items, 'D16');
      assert.ok(shiftItems.length, 'Get row cells from xlsx data');
      if (isDebug && shiftItems.length) inspector('#6: Get row values from xlsx file.shiftItems:', shiftItems);
    }

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

  it('#7: Get column cells from xlsx file "DayReport"', async () => {
    let cell;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const items = exceljs.getColumnCells(sheetName, { header: 'A', range: 'A8:J11' });
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

  it('#8: Get column values from xlsx file "DayReport"', async () => {
    let cellValue;
    //-------------------------
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Report1'
    });

    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const options = { header: 1, range: 'B11:D12' };
    const items = exceljs.getColumnValues(sheetName, options);
    assert.ok(items.length, 'Get row cells from xlsx data');
    if (isDebug && items.length) inspector('#8: Get column values from xlsx file.columnValues:', items);
    if (options.header === 1) {
      const shiftItems = shiftColRangeArray(items, 'D16');
      assert.ok(shiftItems.length, 'Get row cells from xlsx data');
      if (isDebug && shiftItems.length) inspector('#8: Get column values from xlsx file.columnValues:', shiftItems);
    }

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

  it('#9: Write data to xlsx file "DayReport"', async () => {
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
    if (isDebug && items) inspector('#9: Write data to xlsx file.items:', items);
    let items2 = exceljs.getColumnValues(sheetName, { header: 1 });
    if (isDebug && items2) inspector('#9: Write data to xlsx file.items2:', items2);
    let items3 = exceljs.getRowValues(sheetName, { header: 1, range: 'A11:J34' });
    if (isDebug && items3) inspector('#9: Write data to xlsx file.items3:', items3);
    let shiftItems3 = shiftRowRangeArray(items3, 'B2');
    if (isDebug && shiftItems3) inspector('#9: Write data to xlsx file.shiftItems3:', shiftItems3);
    assert.ok(items.length && items2.length && items3.length, 'Write data to xlsx file');

    // Create new exceljs object
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

    exceljs.addSheet('TmpReport3', {
      properties: { tabColor: { argb: '330000' } },
      views: [{ showGridLines: false }]
    });

    const newColumns = [
      {},
      { header: 'Time', key: 'time', width: 20 },
      { header: 'N2O-Q', key: 'N2O_Q', width: 12 },
      { header: 'N2O-CORR', key: 'N2O_CORR', width: 12 },
      { header: 'F120', key: 'F120', width: 12 },
      { header: 'F120-CORR', key: 'F120_CORR', width: 12 },
      { header: 'IsWorking', key: 'isWorking', width: 12 },
      { header: '12F105', key: '12F105', width: 12 },
      { header: '22F105', key: '22F105', width: 12 },
      { header: '32F105', key: '32F105', width: 12 },
      { header: '42F105', key: '42F105', width: 12 },
    ];
    exceljs.addColumns(newColumns, 'TmpReport3');

    sheetName = exceljs.getSheet().name;
    if (isDebug) console.log('worksheet.sheetName:', sheetName, '; bookOptions.lastPrinted:', exceljs.workbook.lastPrinted);
    // Add row values to 'TmpReport1'
    for (let rowIndex = 1; rowIndex <= items.length; rowIndex++) {
      let item = items[rowIndex] ? items[rowIndex] : [];
      exceljs.addRow(item);
    }
    // Add column values to 'TmpReport2'
    for (let colIndex = 1; colIndex <= items2.length; colIndex++) {
      let item = items2[colIndex] ? items2[colIndex] : [];
      if (colIndex === 2 || colIndex === 4) {// colIndex = 2,4 -> 'B','D'
        item = item.map((v, rowIndex) => {// rowIndex -> 11..34
          if (rowIndex >= 11 && rowIndex <= 34) {
            v = (colIndex === 4) ? loRandom(50000, 500000) : loRandom(300, 2000);
          }
          return v;
        });
      }
      exceljs.addColumnValues(item, colIndex, 'TmpReport2');
    }
    // Add row values to 'TmpReport3'
    shiftItems3 = convertRowRangeArray(shiftItems3, newColumns);
    if (isDebug && shiftItems3) inspector('#9: Write data to xlsx file.shiftItems3:', shiftItems3);
    for (let rowIndex = 0; rowIndex < shiftItems3.length; rowIndex++) {
      if (!shiftItems3[rowIndex]) continue;
      let item = shiftItems3[rowIndex];
      exceljs.addRow(item, 'TmpReport3');
    }

    // Write new data to xlsx file
    const fileName = getFileName('DayReport1-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);
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
    assert.ok(items.length === resultItems.length, `Write data to xlsx file: ${items.length} = ${resultItems.length}`);
    assert.ok(items2.length === resultItems2.length, `Write data to xlsx file: ${items2.length} = ${resultItems2.length}`);
  });

  it('#10: Write data to xlsx file "DayReport"', async () => {
    let resultPath = '', currentValue = 0;
    //-------------------------

    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'data',
      bookOptions: {
        fullCalcOnLoad: true
      }
    });

    await exceljs.init();
    let sheetName = exceljs.getSheet().name;
    let items = exceljs.getColumnValues(sheetName, { range: 'C12:C35', header: 1 });
    let items2 = exceljs.getColumnValues(sheetName, { range: 'E12:E35', header: 1 });
    if (isDebug && items) inspector('#10: Write data to xlsx file.items:', items);
    if (isDebug && items2) inspector('#10: Write data to xlsx file.items2:', items2);

    assert.ok(items.length, 'Write data to xlsx file');

    for (let colIndex = 0; colIndex < items.length; colIndex++) {
      if (items[colIndex] === undefined) continue;
      const item = items[colIndex];
      for (let colIndex2 = 0; colIndex2 < item.length; colIndex2++) {
        if (item[colIndex2] === undefined) continue;
        if (!currentValue) {
          item[colIndex2] = loRound(loRandom(300, 2000), 3);
        } else {
          item[colIndex2] = loRound(item[colIndex2] - loRandom(300, 2000), 3);
        }
        currentValue = item[colIndex2];
      }
    }

    currentValue = 0;
    for (let colIndex = 0; colIndex < items2.length; colIndex++) {
      if (items2[colIndex] === undefined) continue;
      const item = items2[colIndex];
      for (let colIndex2 = 0; colIndex2 < item.length; colIndex2++) {
        if (item[colIndex2] === undefined) continue;
        if (!currentValue) {
          item[colIndex2] = loRound(loRandom(30, 70), 3);
        } else {
          item[colIndex2] = loRound(item[colIndex2] - loRandom(30, 70), 3);
        }
        currentValue = item[colIndex2];
      }
    }
    if (isDebug && items) inspector('#10: Write data to xlsx file.items:', items);
    if (isDebug && items2) inspector('#10: Write data to xlsx file.items2:', items2);

    exceljs.getColumn('C').values = items[3];
    exceljs.getColumn('E').values = items2[5];

    // Write new data to xlsx file
    const fileName = getFileName('DayReport1-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);
    // console.log('writeFile.resultPath:', resultPath);

    // Create exceljs object
    exceljs = new ExceljsHelperClass({
      excelPath: resultPath,
      sheetName: 'data'
    });

    await exceljs.init();
    sheetName = exceljs.getSheet().name;
    const resultItems = exceljs.getColumnValues(sheetName, { range: 'C12:C35', header: 1 });
    assert.ok(items.length === resultItems.length, `Write data to xlsx file: ${items.length} = ${resultItems.length}`);
  });

  it('#11: Write data to xlsx file "YearReport"', async () => {
    let resultPath = '', selCell = null;
    //-----------------------------------

    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile2],
      sheetName: 'Data_CNBB',// Instructions Data_CNBB Results Test
      bookOptions: {
        fullCalcOnLoad: true
      }
    });

    await exceljs.init();
    let sheetName = exceljs.getSheet().name;
    // Set start row number     
    const startRow = 6;
    // Get current date    
    let currentDate = moment.utc([2022, 0, 1, 0, 0, 0]).format();
    // Set start date cell
    exceljs.getCell(`B${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD HH:mm');

    // Get all hours for date range
    const startDate = moment('2022-01-01');
    const endDate = moment('2022-01-02');
    let hours = endDate.diff(startDate, 'hours');
    let days = endDate.diff(startDate, 'days');
    if (isDebug && hours) console.log('hours:', hours);
    if (isDebug && days) console.log('days:', days);

    // Add rows
    for (let index = startRow; index < hours + startRow - 1; index++) {
      // Add 1 hour and get "nextDate"
      let nextDate = moment.utc(currentDate).add(1, 'hours').format();
      currentDate = nextDate;
      // Duplicate row
      exceljs.duplicateRow(index);
      // Set date cell
      exceljs.getCell(`B${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD HH:mm');
      // Set shared formulas
      exceljs.getCell(`K${index + 1}`).value = { sharedFormula: `K${startRow}`, result: 'Цех не працює' };
      exceljs.getCell(`M${index + 1}`).value = { sharedFormula: `M${startRow}`, result: '' };
      exceljs.getCell(`N${index + 1}`).value = { sharedFormula: `N${startRow}`, result: '0' };
      exceljs.getCell(`O${index + 1}`).value = { sharedFormula: `O${startRow}`, result: '0' };
      exceljs.getCell(`P${index + 1}`).value = { sharedFormula: `P${startRow}`, result: '' };
      exceljs.getCell(`Q${index + 1}`).value = { sharedFormula: `Q${startRow}`, result: '0' };
      exceljs.getCell(`R${index + 1}`).value = { sharedFormula: `R${startRow}`, result: '0' };
      exceljs.getCell(`S${index + 1}`).value = { sharedFormula: `S${startRow}`, result: '' };
    }

    // actualRowCount
    const metrics = exceljs.getSheetMetrics();
    if (isDebug && metrics) inspector('metrics:', metrics);
    assert.ok(true, 'Write data to xlsx file "YearReport"');

    // Write new data to xlsx file
    const fileName = getFileName('YearReport-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);

    // Create exceljs object
    exceljs = new ExceljsHelperClass({
      excelPath: resultPath,
      sheetName: 'Data_CNBB'
    });

    await exceljs.init();
    sheetName = exceljs.getSheet().name;
    const resultItems = exceljs.getCells(sheetName, { range: `A${startRow}:A${metrics.actualRowCount}` });
    const actualRows = metrics.actualRowCount - startRow + 1;
    assert.ok(actualRows === resultItems.length, `Write data to xlsx file "YearReport": ${actualRows} = ${resultItems.length}`);
  });

  it('#12: Write data to xlsx file "YearReport2"', async () => {
    let resultPath = '', selCell = null;
    //-----------------------------------

    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile3],
      sheetName: 'Data_CNBB',// Instructions Data_CNBB Results Test
      bookOptions: {
        fullCalcOnLoad: true
      }
    });

    await exceljs.init();
    let sheetName = exceljs.getSheet().name;
    // Set start row number     
    const startRow = 20;
    // Get current date    
    let currentDate = moment.utc([2022, 0, 1, 0, 0, 0]).format();
    // Set start date cell
    exceljs.getCell(`B${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD');
    exceljs.getCell(`C${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('HH:mm');

    // Set data cell
    exceljs.getCell(`H${startRow}`).value = 1;
    exceljs.getCell(`J${startRow}`).value = loRandom(0, 1);
    let isRun = !!exceljs.getCell(`J${startRow}`).value;
    if (isRun) {
      exceljs.getCell(`D${startRow}`).value = loRandom(300, 2000);
      exceljs.getCell(`F${startRow}`).value = loRandom(30000, 300000);
    } else {
      exceljs.getCell(`D${startRow}`).value = 0;
      exceljs.getCell(`F${startRow}`).value = 0;
    }

    // Get all hours for date range
    const startDate = moment('2022-01-01');
    const endDate = moment('2022-01-02');
    let hours = endDate.diff(startDate, 'hours');
    let days = endDate.diff(startDate, 'days');
    if (true && hours) console.log('hours:', hours);
    if (true && days) console.log('days:', days);

    // Add rows
    for (let index = startRow; index < hours + startRow - 1; index++) {
      // Add 1 hour and get "nextDate"
      let nextDate = moment.utc(currentDate).add(1, 'hours').format();
      currentDate = nextDate;
      // Duplicate row
      exceljs.duplicateRow(index);
      // Set date cell
      exceljs.getCell(`B${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD');
      exceljs.getCell(`C${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('HH:mm');

      // Set conditional formatting for cells
      exceljs.addSheetConditionalFormatting([`E${index + 1}`, `G${index + 1}`, `I${index + 1}`, `K${index + 1}`], rulesForCells.errorSign);

      // Set shared formulas
      exceljs.getCell(`E${index + 1}`).value = { sharedFormula: `E${startRow}`, result: '' };
      exceljs.getCell(`G${index + 1}`).value = { sharedFormula: `G${startRow}`, result: '' };
      exceljs.getCell(`I${index + 1}`).value = { sharedFormula: `I${startRow}`, result: '' };
      exceljs.getCell(`K${index + 1}`).value = { sharedFormula: `K${startRow}`, result: '' };
      exceljs.getCell(`L${index + 1}`).value = { sharedFormula: `L${startRow}`, result: '' };

      exceljs.getCell(`N${index + 1}`).value = { sharedFormula: `N${startRow}`, result: '' };
      exceljs.getCell(`O${index + 1}`).value = { sharedFormula: `O${startRow}`, result: '' };
      exceljs.getCell(`P${index + 1}`).value = { sharedFormula: `P${startRow}`, result: '' };
      exceljs.getCell(`Q${index + 1}`).value = { sharedFormula: `Q${startRow}`, result: '' };
      exceljs.getCell(`R${index + 1}`).value = { sharedFormula: `R${startRow}`, result: '' };
      exceljs.getCell(`S${index + 1}`).value = { sharedFormula: `S${startRow}`, result: '' };
      exceljs.getCell(`T${index + 1}`).value = { sharedFormula: `T${startRow}`, result: '' };

      // Set data cell
      exceljs.getCell(`H${index + 1}`).value = 1;
      exceljs.getCell(`J${index + 1}`).value = loRandom(0, 1);
      let isRun = !!exceljs.getCell(`J${index + 1}`).value;
      if (isRun) {
        exceljs.getCell(`E${index + 1}`).value = loRandom(0, 1);
        exceljs.getCell(`G${index + 1}`).value = loRandom(0, 1);
        exceljs.getCell(`D${index + 1}`).value = loRandom(300, 2000);
        exceljs.getCell(`F${index + 1}`).value = loRandom(30000, 300000);
      } else {
        exceljs.getCell(`D${index + 1}`).value = 0;
        exceljs.getCell(`F${index + 1}`).value = 0;
      }

      

    }

    // actualRowCount
    const metrics = exceljs.getSheetMetrics();
    if (true && metrics) inspector('metrics:', metrics);
    assert.ok(true, 'Write data to xlsx file "YearReport2"');

    // Write new data to xlsx file
    const fileName = getFileName('YearReport2-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);

    // Create exceljs object
    exceljs = new ExceljsHelperClass({
      excelPath: resultPath,
      sheetName: 'Data_CNBB'
    });

    await exceljs.init();
    sheetName = exceljs.getSheet().name;
    const resultItems = exceljs.getCells(sheetName, { range: `B${startRow}:B${metrics.actualRowCount}` });
    const actualRows = metrics.actualRowCount - startRow + 1;
    assert.ok(actualRows === resultItems.length, `Write data to xlsx file "YearReport2": ${actualRows} = ${resultItems.length}`);
  });
});
