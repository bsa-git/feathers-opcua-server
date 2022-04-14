/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');
const loIsDate = require('lodash/isDate');
const loForEach = require('lodash/forEach');
const loCompact = require('lodash/compact');
const Path = require('path');
const join = Path.join;
const {
  inspector,
  isObject,
  getValueType,
  getDateTime,
  readJsonFileSync,
  getLetter4Index,
  getIndex4Range
} = require('../lib');

const ExcelJS = require('exceljs');

const debug = require('debug')('app:exceljs-helper');
const isDebug = false;

const valueTypes = ['Null', 'Merge', 'Number', 'String', 'Date', 'Hyperlink', 'Formula', 'SharedString', 'RichText', 'Boolean', 'Error'];


/**
 * @method exeljsReadFile
 * @param {String|Array} path
 * @returns {Object}
 */
const exeljsReadFile = async function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  // Read file
  await workbook.xlsx.readFile(path);
  return workbook;
};

/**
 * @method exeljsReadJsonFile
 * @param {String|Array} path
 * @returns {Object}
 */
const exeljsReadJsonFile = async function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  // Read file
  const jsonData = readJsonFileSync(path);
  // Load from buffer
  await workbook.xlsx.load(jsonData);
  return workbook;
};

/**
 * @method exeljsReadJsonData
 * @param {Object[]} jsonData
 * @returns {Object}
 */
const exeljsReadJsonData = async function (jsonData) {
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  // Load from buffer
  await workbook.xlsx.load(jsonData);
  return workbook;
};

/**
 * @method exeljsReadCsvFile
 * @param {String|Array} path
 * @param {Object} options
 * @returns {Object}
 */
const exeljsReadCsvFile = async function (path, options) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  // Read file
  await workbook.csv.readFile(path, options);
  return workbook;
};

/**
 * @method exeljsWriteToFile
 * @param {Object} workbook
 * @param {String|Array} path
 * @returns {String}
 */
const exeljsWriteFile = async function (workbook, path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  await workbook.xlsx.writeFile(path);
  return path;
};

/**
 * @method exeljsWriteCsvFile
 * @param {Object} workbook
 * @param {String|Array} path
 * @param {Object} options
 * @returns {String}
 */
const exeljsWriteCsvFile = async function (workbook, path, options) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  await workbook.csv.writeFile(path, options);
  return path;
};

/**
 * Create a Workbook
 * @method exeljsCreateBook
 * @param {Object} options
 * e.g. {
    creator: 'Me',
    lastModifiedBy: 'Her',
    created: new Date(1985, 8, 30),
    modified: new Date(),
    lastPrinted: new Date(2016, 9, 27),
    date1904: true,
    fullCalcOnLoad: true
    }
 * @returns {Object}
 */
const exeljsCreateBook = function (options) {
  const workbook = new ExcelJS.Workbook();
  if (options) {
    exeljsSetBookProperties(workbook, options);
  }
  return workbook;
};

/**
 * Create a Workbook
 * @method exeljsSetBookProperties
 * @param {Object} workbook
 * @param {Object} options
 * e.g. {
    creator: 'Me',
    lastModifiedBy: 'Her',
    created: new Date(1985, 8, 30),
    modified: new Date(),
    lastPrinted: new Date(2016, 9, 27),
    date1904: true,
    fullCalcOnLoad: true
   }
 * @returns {Object}
 */
const exeljsSetBookProperties = function (workbook, options) {
  if (options.creator) {
    workbook.creator = options.creator;
  }
  if (options.lastModifiedBy) {
    workbook.lastModifiedBy = options.lastModifiedBy;
  }
  if (options.modified) {
    workbook.modified = options.modified;
  }
  if (options.lastPrinted) {
    workbook.lastPrinted = options.lastPrinted;
  }
  if (options.date1904 !== undefined) {
    workbook.properties.date1904 = options.date1904;
  }
  if (options.fullCalcOnLoad !== undefined) {
    workbook.calcProperties.fullCalcOnLoad = options.fullCalcOnLoad;
  }
  return workbook;
};

/**
 * Append a Worksheet to a Workbook
 * @method exeljsBookAppendSheet
 * @param {Object} workbook
 * @param {Object} sheetName
 * @param {Object} params
 * @returns {Object}
 */
const exeljsBookAppendSheet = function (workbook, sheetName = '', params = {}) {
  return workbook.addWorksheet(sheetName, params);
};

/**
 * // Remove the worksheet using worksheet id
 * @method exeljsBookRemoveSheet
 * @param {Object} workbook
 * @param {Number} id
 */
const exeljsBookRemoveSheet = function (workbook, id) {
  workbook.removeWorksheet(id);
};

/**
 * // Remove the worksheet using worksheet id
 * @method exeljsBookRemoveSheet
 * @param {Object} workbook
 * @param {String|Number} identifier
 * e.g. workbook.getWorksheet('My Sheet') | workbook.getWorksheet(id)
 * @returns {Object}
 */
const exeljsGetSheet = function (workbook, identifier) {
  const sheet = workbook.getWorksheet(identifier);
  return sheet;
};

/**
 * @method exeljsGetCells
 * @param {Object} workbook
 * @param {String} sheetName
 * @param {Object} options
 * e.g. { includeEmpty: true } | { range: 'B11:C34' } | {}
 * @returns {Object[]}
 */
const exeljsGetCells = function (workbook, sheetName = '', options = {}) {
  let myWorksheet = null, myCell = {}, cells = [];
  //----------------------------------------------
  // Get 
  workbook.eachSheet(function (worksheet, sheetId) {
    myWorksheet = null;
    // Get worksheet
    if (sheetName && sheetName === worksheet.name) {
      myWorksheet = worksheet;
    }

    if (!sheetName) {
      myWorksheet = worksheet;
    }
    // Get eachCell for worksheet
    if (myWorksheet) {
      if (isDebug) console.log(`name=${worksheet.name}; id=${sheetId}; state=${worksheet.state}; rowCount=${worksheet.rowCount}; columnCount=${worksheet.columnCount}; actualColumnCount=${worksheet.actualColumnCount};`);
      // console.log(`name=${worksheet.name}; id=${sheetId}; state=${worksheet.state}; rowCount=${worksheet.rowCount}; columnCount=${worksheet.columnCount}; actualColumnCount=${worksheet.actualColumnCount};`);
      for (let index = 1; index <= worksheet.actualColumnCount + 1; index++) {
        const column = worksheet.getColumn(index);
        // iterate over all current cells in this column
        column.eachCell({ includeEmpty: !!options.includeEmpty }, function (cell, rowNumber) {
          myCell = {};
          myCell.worksheetName = worksheet.name;
          myCell.address = cell.address;
          myCell.address2 = { col: getLetter4Index(index), row: rowNumber };
          myCell.address3 = { col: index, row: rowNumber };
          myCell.value = isObject(cell.value) && cell.value.result ? cell.value.result : cell.value;
          myCell.valueType = getValueType(myCell.value);
          myCell.cellType = valueTypes[cell.type];
          if (cell.name) {
            myCell.name = cell.name;
          }
          if (cell.names && cell.names.length) {
            myCell.names = cell.names;
          }
          if (myCell.valueType === 'Number') {
            myCell.value = loRound(myCell.value, 3);
          }
          if (myCell.cellType === 'Date') {
            myCell.value = getDateTime(myCell.value).split('.')[0];
            myCell.valueType = 'DateTime';
          }
          if (myCell.cellType === 'Formula' && myCell.valueType === 'Object' && loIsDate(myCell.value)) {
            myCell.value = getDateTime(myCell.value).split('.')[0];
            myCell.valueType = 'DateTime';
          }
          if (myCell.cellType === 'Formula' && myCell.valueType === 'Object' && myCell.value.formula) {
            myCell.value = 0;
            myCell.valueType = 'Number';
          }
          if (isObject(cell.value) && cell.value.formula) {
            myCell.formula = cell.value.formula;
          }
          if (isObject(cell.value) && cell.value.sharedFormula) {
            myCell.sharedFormula = cell.value.sharedFormula;
          }
          if (isObject(cell.value) && cell.value.ref) {
            myCell.ref = cell.value.ref;
          }
          if (isObject(cell.value) && cell.value.shareType) {
            myCell.shareType = cell.value.shareType;
          }
          myCell.cell = cell;
          myCell.column = column;
          myCell.row = worksheet.getRow(rowNumber);
          cells.push(myCell);
          if (isDebug && loStartsWith(myCell.address, 'A')) {
            inspector('myCell:', loOmit(myCell, ['cell', 'column', 'row']));
          }
        });
      }
    }
  });
  if (options.range) {
    const range = getIndex4Range(options.range);
    const startCol = range.start.col;
    const startRow = range.start.row;
    const endCol = range.end.col;
    const endRow = range.end.row;
    cells = cells.filter(cell => (cell.address3.col >= startCol && cell.address3.col <= endCol) && (cell.address3.row >= startRow && cell.address3.row <= endRow));
  }
  if (isDebug) inspector(`exeljsGetCells.${sheetName}.cells.length:`, cells.length);
  // inspector(`exeljsGetCells.${sheetName}.cells.length:`, cells.length);
  return cells;
};

/**
 * @method exeljsGetRowCells
 * @param {Object} workbook
 * @param {String} sheetName
 * @param {Object} options
 * e.g. { includeEmpty: true } | { header:'A' } | { header:1 } | { range: 'B11:C34' } | {}
 * @returns {Object[]|Array[]}
 * e.g. for {header: 'A'}
 * [{ A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7' },
 *  { A: '2', B: '3', C: '4', D: '5', E: '6', F: '7', G: '8' }]
 * e.g. for {header: 1}
 * [['1', '2', '3', '4', '5', '6', '7'],
 *  ['2', '3', '4', '5', '6', '7', '8' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ key1: 1, key2: 2, key3: 3, key4: 4, key5: 5, key6: 6, key7: 7 },
 * { key1: 2, key2: 3, key3: 4, key4: 5, key5: 6, key6: 7, key7: 8 } ]
 */
const exeljsGetRowCells = function (workbook, sheetName = '', options = {}) {
  let rowCells = [];
  //------------------------------
  const cells = exeljsGetCells(workbook, sheetName, options);
  for (let index = 0; index < cells.length; index++) {
    let cell = cells[index];
    // if (cell.value === null) continue;
    const rowIndex = cell.address2.row;
    const colCharIndex = cell.address2.col;
    const colIndex = cell.address3.col;
    const colKey = cell.column.key ? cell.column.key : colCharIndex;
    // const colKey = cell.column.key ? cell.column.key : colIndex;
    // cell = loOmit(cell, ['cell', 'column', 'row']);
    if (!rowCells[rowIndex]) {
      rowCells[rowIndex] = (options.header && options.header === 1) ? [] : {};
    }
    if (!options.header) {
      rowCells[rowIndex][colKey] = cell;
    }
    if (options.header && options.header === 'A') {
      rowCells[rowIndex][colCharIndex] = cell;
    }
    if (options.header && options.header === 1) {
      rowCells[rowIndex][colIndex] = cell;
    }

  }
  return rowCells;
};

/**
 * @method exeljsGetRowValues
 * @param {Object} workbook
 * @param {String} sheetName
 * @param {Object} options
 * e.g. { includeEmpty: true } | { header:'A' } | { header:1 } | { range: 'B11:C34' } |{}
 * @returns {Object[]|Array[]}
 * e.g. for {header: 'A'}
 * [{ A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7' },
 *  { A: '2', B: '3', C: '4', D: '5', E: '6', F: '7', G: '8' }]
 * e.g. for {header: 1}
 * [['1', '2', '3', '4', '5', '6', '7'],
 *  ['2', '3', '4', '5', '6', '7', '8' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ key1: 1, key2: 2, key3: 3, key4: 4, key5: 5, key6: 6, key7: 7 },
 * { key1: 2, key2: 3, key3: 4, key4: 5, key5: 6, key6: 7, key7: 8 } ]
 */
const exeljsGetRowValues = function (workbook, sheetName = '', options = {}) {
  const items = exeljsGetRowCells(workbook, sheetName, options);
  for (let rowIndex = 0; rowIndex <= items.length; rowIndex++) {
    const item = items[rowIndex];
    if (!item) continue;
    if (Array.isArray(item)) {
      for (let colIndex = 0; colIndex <= item.length; colIndex++) {
        if (!item[colIndex]) continue;
        const cell = item[colIndex];
        item[colIndex] = cell.value;
      }
    } else {
      loForEach(item, function (cell, key) {
        item[key] = cell.value;
      });
    }
  }
  return items;
};

/**
 * @method exeljsGetColumnCells
 * @param {Object} workbook
 * @param {String} sheetName
 * @param {Object} options
 * e.g. { includeEmpty: true } | { header:'A' } | { header:1 } | { range: 'B11:C34' } | {}
 * @returns {Object[]|Array[]}
 * e.g. for {header: 'A'}
 * [{ rowIndex1: '11', rowIndex2: '22', rowIndex3: '33', rowIndex4: '44', rowIndex5: '55', rowIndex6: '66', rowIndex7: '77' },
 *  { rowIndex1: '22', rowIndex2: '33', rowIndex3: '44', rowIndex4: '55', rowIndex5: '66', rowIndex6: '77', rowIndex7: '88' }]
 * e.g. for {header: 1}
 * [['11', '22', '33', '44', '55', '66', '77'],
 *  ['22', '33', '44', '55', '66', '77', '88' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ rowIndex1: 11, rowIndex2: 22, rowIndex3: 33, rowIndex4: 44, rowIndex5: 55, rowIndex6: 66, rowIndex7: 77 },
 * { rowIndex1: 22, rowIndex2: 33, rowIndex3: 44, rowIndex4: 55, rowIndex5: 66, rowIndex6: 77, rowIndex7: 88 } ]
 */
const exeljsGetColumnCells = function (workbook, sheetName = '', options = {}) {
  let columnCells = [];
  //------------------------------
  const cells = exeljsGetCells(workbook, sheetName, options);
  for (let index = 0; index < cells.length; index++) {
    let cell = cells[index];
    // if (cell.value === null) continue;
    const rowIndex = cell.address2.row;
    const colIndex = cell.address3.col;
    // cell = loOmit(cell, ['cell', 'column', 'row']);
    if (!columnCells[colIndex]) {
      columnCells[colIndex] = (options.header && options.header === 1) ? [] : {};
    }
    if (!options.header) {
      columnCells[colIndex][rowIndex] = cell;
    }
    if (options.header && options.header === 'A') {
      columnCells[colIndex][rowIndex] = cell;
    }
    if (options.header && options.header === 1) {
      columnCells[colIndex][rowIndex] = cell;
    }

  }
  // return loCompact(columnCells);
  return columnCells;
};

/**
 * @method exeljsGetRowValues
 * @param {Object} workbook
 * @param {String} sheetName
 * @param {Object} options
 * e.g. { includeEmpty: true } | { header:'A' } | { header:1 } | { range: 'B11:C34' } | {}
 * @returns {Object[]|Array[]}
 * e.g. for {header: 'A'}
 * [{ rowIndex1: '11', rowIndex2: '22', rowIndex3: '33', rowIndex4: '44', rowIndex5: '55', rowIndex6: '66', rowIndex7: '77' },
 *  { rowIndex1: '22', rowIndex2: '33', rowIndex3: '44', rowIndex4: '55', rowIndex5: '66', rowIndex6: '77', rowIndex7: '88' }]
 * e.g. for {header: 1}
 * [['11', '22', '33', '44', '55', '66', '77'],
 *  ['22', '33', '44', '55', '66', '77', '88' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ rowIndex1: 11, rowIndex2: 22, rowIndex3: 33, rowIndex4: 44, rowIndex5: 55, rowIndex6: 66, rowIndex7: 77 },
 * { rowIndex1: 22, rowIndex2: 33, rowIndex3: 44, rowIndex4: 55, rowIndex5: 66, rowIndex6: 77, rowIndex7: 88 } ]
 */
const exeljsGetColumnValues = function (workbook, sheetName = '', options = {}) {
  const items = exeljsGetColumnCells(workbook, sheetName, options);
  for (let colIndex = 0; colIndex <= items.length; colIndex++) {
    const item = items[colIndex];
    if (!item) continue;
    if (Array.isArray(item)) {
      for (let rowIndex = 0; rowIndex <= item.length; rowIndex++) {
        if (!item[rowIndex]) continue;
        const cell = item[rowIndex];
        item[rowIndex] = cell.value;
      }
    } else {
      loForEach(item, function (cell, key) {
        item[key] = cell.value;
      });
    }
  }
  return items;
};


module.exports = {
  exeljsReadFile,
  exeljsReadJsonFile,
  exeljsReadCsvFile,
  exeljsReadJsonData,
  exeljsWriteFile,
  exeljsWriteCsvFile,
  exeljsCreateBook,
  exeljsSetBookProperties,
  exeljsBookAppendSheet,
  exeljsBookRemoveSheet,
  exeljsGetSheet,
  exeljsGetCells,
  exeljsGetRowCells,
  exeljsGetRowValues,
  exeljsGetColumnCells,
  exeljsGetColumnValues
};
