/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');
const loForEach = require('lodash/forEach');
const Path = require('path');
const join = Path.join;
const {
  inspector,
  isObject,
  getValueType,
  getDateTime,
  isValidDateTime,
  dtToObject
} = require('../lib');

const ExcelJS = require('exceljs');

const debug = require('debug')('app:exceljs-helper');
const isDebug = false;

const numberToLetter = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ'];
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
 * @method exeljsGetCells
 * @param {Object} workbook
 * @param {String} sheetName
 * @returns {Object[]}
 */
const exeljsGetCells = function (workbook, sheetName = '') {
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
      if (isDebug) console.log(`name=${worksheet.name}; id=${sheetId}; state=${worksheet.state}; rowCount=${worksheet.rowCount}; actualColumnCount=${worksheet.actualColumnCount};`);
      for (let index = 1; index <= worksheet.actualColumnCount; index++) {
        const indexCol = worksheet.getColumn(index);
        // iterate over all current cells in this column
        indexCol.eachCell({ includeEmpty: true }, function (cell, rowNumber) {
          // if (cell.value) {
          myCell = {};
          myCell.worksheetName = worksheet.name;
          myCell.address = cell.address;
          myCell.address2 = { col: numberToLetter[index], row: rowNumber };
          myCell.value = isObject(cell.value) && cell.value.result ? cell.value.result : cell.value;
          myCell.valueType = getValueType(myCell.value);
          myCell.cellType = valueTypes[cell.type];
          if (myCell.valueType === 'Number') {
            myCell.value = loRound(myCell.value, 3);
          }
          if (myCell.cellType === 'Date') {
            myCell.value = getDateTime(myCell.value).split('.')[0];
            myCell.valueType = 'DateTime';
          }
          if (myCell.cellType === 'Formula' && myCell.valueType === 'Object') {
            myCell.value = getDateTime(myCell.value).split('.')[0];
            myCell.valueType = 'DateTime';
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
          myCell.column = indexCol;
          myCell.row = worksheet.getRow(rowNumber);
          cells.push(myCell);
          if (isDebug && loStartsWith(myCell.address, 'A')) {
            inspector('myCell:', loOmit(myCell, ['cell', 'column', 'row']));
          }
        });
      }
    }
  });
  return cells;
};


module.exports = {
  exeljsReadFile,
  exeljsWriteFile,
  exeljsGetCells,
};
