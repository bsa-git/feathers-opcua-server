/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');
const loForEach = require('lodash/forEach');
const Path = require('path');
const join = Path.join;
const {
  inspector,
  getValueType,
  splitStr2StrNum,
  readJsonFileSync,
  getIndex4Letter,
  getIndex4Range,
  getInt,
  getLetter4Index
} = require('../lib');

const XLSX = require('xlsx');

const debug = require('debug')('app:xlsx-helper');
const isDebug = false;

const typeOf = { n: 'number', s: 'string', b: 'boolean' };

/**
 * Read file
 * @method xlsxReadFile
 * @param {String|Array} path
 * @returns {Object}
 */
const xlsxReadFile = function (path) {
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const workbook = XLSX.readFile(path);
  return workbook;
};

/**
 * Read json file
 * @method xlsxReadJsonFile
 * @param {String|Array} path
 * @param {String} sheetName
 * @returns {Object}
 */
const xlsxReadJsonFile = function (path, sheetName) {
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const jsonData = readJsonFileSync(path);
  const workbook = xlsxCreateBook();
  const worksheet = xlsxJsonToSheet(jsonData, { skipHeader: true });
  xlsxBookAppendSheet(workbook, worksheet, sheetName);
  return workbook;
};

/**
 * Read json data
 * @method xlsxReadJsonData
 * @param {Object[]} jsonData
 * @param {String} sheetName
 * @returns {Object}
 */
const xlsxReadJsonData = function (jsonData, sheetName) {
  //--------------------------
  const workbook = xlsxCreateBook();
  const worksheet = xlsxJsonToSheet(jsonData, { skipHeader: true });
  xlsxBookAppendSheet(workbook, worksheet, sheetName);
  return workbook;
};

/**
 * Write file
 * @method xlsxWriteToFile
 * @param {Object} workbook
 * @param {String|Array} path
 * @returns {String}
 */
const xlsxWriteFile = function (workbook, path) {
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  XLSX.writeFile(workbook, path);
  return path;
};

/**
 * The book_new utility function creates an empty workbook with no worksheets
 * @method xlsxCreateBook
 * @returns {Object}
 */
const xlsxCreateBook = function () {
  const workbook = XLSX.utils.book_new();
  return workbook;
};

/**
 * Append a Worksheet to a Workbook
 * @method xlsxBookAppendSheet
 * @param {Object} workbook
 * @param {Object} worksheet
 * @param {Object} sheetName
 * @returns {Object}
 */
const xlsxBookAppendSheet = function (workbook, worksheet, sheetName = '') {
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
};


/**
 * Converts a worksheet object to an array of JSON objects
 * @method xlsxSheetToJson
 * @param {Object} worksheet
 * @param {Object} options
 * e.g. {} | {header:'A', range: 'B6:F8' } | {header:1} | {header:["1","2","3","4"]}
 * @returns {Array}
 * e.g. [ { B: 1983, C: 120, D: 82583, E: 567, F: 1 },
          { B: 1223, C: 34, D: 96740, E: 234, F: 2 },
          { B: 1884, C: 56, D: 123359, E: 678, F: 3 }
        ]
 */
const xlsxSheetToJson = function (worksheet, options = {}) {
  let jsonData, convertRow, result = false;
  //------------------------------
  jsonData = XLSX.utils.sheet_to_json(worksheet, options);
  if (isDebug && options) inspector('xlsxSheetToJson.params:', options);
  if (isDebug && jsonData.length) inspector('xlsxSheetToJson.sheet_to_json.jsonData:', jsonData);
  return Array.isArray(jsonData)? jsonData : [];
};

/**
 * Converts an array of JS objects to a worksheet
 * @method xlsxSheetToJson
 * @param {Object[]} data
 * e.g. [{A: 1, B: 2}, {A: 3, B: 4}]
 * @param {Object} options
 * e.g. {} | {header:["A","B"], skipHeader: false | true}
 * @returns {Object}
 * e.g. A B     1 2
 *      1 2  OR 3 4
 *      3 4
 */
const xlsxJsonToSheet = function (data, options = {}) {
  let worksheet = null;
  //------------------------------
  worksheet = XLSX.utils.json_to_sheet(data, options);
  if (isDebug) inspector('xlsxJsonToSheet.params:', options);
  if (isDebug) inspector('xlsxJsonToSheet.data:', data);
  return worksheet;
};

/**
 * Adds an array of JS objects to an existing worksheet
 * @method xlsxSheetAddJson
 * @param {Object} worksheet
 * @param {Object[]} data
 * e.g. [{A: 1, B: 2}, {A: 3, B: 4}]
 * @param {Object} options
 * e.g. {} | {header:["A","B"], skipHeader: false | true, origin: "A2" | { r: 1, c: 4} | origin: -1}
 * @returns {Object}
 */
const xlsxSheetAddJson = function (worksheet, data, options = {}) {
  XLSX.utils.sheet_add_json(worksheet, data, options);
  if (isDebug) inspector('xlsxSheetAddJson.params:', options);
  if (isDebug) inspector('xlsxSheetAddJson.data:', data);
  return worksheet;
};

/**
 * Get cells from workbook
 * @method xlsxGetCellsFromFile
 * @param {Object} workbook
 * @param {String} sheetName
 * @returns {Object[]}
 */
const xlsxGetCells = function (workbook, sheetName = '', options = {}) {
  let worksheet = null, myCell = {}, myItem = {}, cells = [];
  //---------------------------------------------------------
  const sheets = workbook.SheetNames;
  // Get 
  sheets.forEach(function (sheet) {
    worksheet = null;
    // Get worksheet
    if (sheetName && sheetName === sheet) {
      worksheet = workbook.Sheets[sheet];
    }

    if (!sheetName) {
      worksheet = workbook.Sheets[sheet];
    }
    // Get eachCell for worksheet
    if (worksheet) {
      for (let z in worksheet) {
        /* all keys that do not begin with "!" correspond to cell addresses */
        if (z[0] === '!') continue;

        myCell = {};
        myItem = worksheet[z];
        const isValidDateTime = (typeOf[myItem.t] === 'number') && myItem.w.includes(':');
        let address2 = splitStr2StrNum(z);
        address2 = { col: address2[0], row: address2[1] };
        const address3 = { col: getIndex4Letter(address2.col), row: address2.row };

        myCell.worksheetName = sheet;
        myCell.address = z;
        myCell.address2 = address2;
        myCell.address3 = address3;
        myCell.value = myItem.v;
        myCell.valueType = isValidDateTime ? 'DateTime' : getValueType(myCell.value);
        if (myCell.valueType === 'DateTime') {
          myCell.value = myItem.w;
        }
        if (myCell.valueType === 'Number') {
          myCell.value = loRound(myItem.v, 3);
        }
        if (myItem.f) {
          myCell.formula = myItem.f;
        }
        if (myItem.w) {
          myCell.formatValue = myItem.w;
        }
        myCell.xlsx = XLSX;
        myCell.workbook = workbook;
        myCell.worksheet = worksheet;
        myCell.cell = myItem;
        cells.push(myCell);
        if (isDebug && loStartsWith(myCell.address, 'A')) {
          inspector('myCell:', loOmit(myCell, ['xlsx', 'workbook', 'worksheet', 'cell']));
        }
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
  return cells;
};


/**
 * A-1 based range representing the sheet range
 * @method xlsxGetWorksheetRef
 * @param {Object} worksheet
 * @returns {String}
 */
const xlsxGetWorksheetRef = function (worksheet) {
  const ref = worksheet['!ref'];
  if (isDebug) inspector('xlsxGetWorksheetRef.ref:', ref);
  return ref;
};



module.exports = {
  xlsxReadFile,
  xlsxReadJsonFile,
  xlsxReadJsonData,
  xlsxWriteFile,
  xlsxGetCells,
  xlsxCreateBook,
  xlsxBookAppendSheet,
  xlsxSheetToJson,
  xlsxJsonToSheet,
  xlsxSheetAddJson,
  xlsxGetWorksheetRef,
};
