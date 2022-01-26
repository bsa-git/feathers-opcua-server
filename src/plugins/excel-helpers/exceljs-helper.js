/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const Path = require('path');
const join = Path.join;
const {
  inspector,
  isObject,
  getTypeOf,
  getDateTime
} = require('../lib');

const ExcelJS = require('exceljs');

const debug = require('debug')('app:exceljs-helper');
const isDebug = false;

const numberToLetter = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ'];

//---------------- READ FILE -------------//

/**
 * @method exeljsGetCellsFromFile
 * @param {String|Array} path
 * @param {String} sheetName
 * @returns {Array}
 */
const exeljsGetCellsFromFile = async function (path, sheetName = '') {
  let myWorksheet = null, myCell = {}, cells = [];
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // Read file
  await workbook.xlsx.readFile(path);

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
        indexCol.eachCell(function (cell, rowNumber) {
          if (cell.value) {
            myCell = {};
            myCell.worksheet = worksheet.name;
            myCell.cell = `${numberToLetter[index]}${rowNumber}`;
            myCell.value = isObject(cell.value)? cell.value.result  : cell.value;
            myCell.typeOf = getTypeOf(myCell.value);
            if(myCell.typeOf === 'number'){
              myCell.value = loRound(myCell.value, 3);
            }
            if(myCell.typeOf === 'object'){
              myCell.value = getDateTime(cell.value.result, false);
              myCell.typeOf = 'datetime';
            }
            if(myCell.typeOf === 'undefined'){
              myCell.value = 0;
              myCell.typeOf = 'number';
            }
            if(isObject(cell.value) && cell.value.formula){
              myCell.formula = cell.value.formula;
            }
            if(isObject(cell.value) && cell.value.sharedFormula){
              myCell.sharedFormula = cell.value.sharedFormula;
            }
            if(isObject(cell.value) && cell.value.ref){
              myCell.ref = cell.value.ref;
            }
            if(isObject(cell.value) && cell.value.shareType){
              myCell.shareType = cell.value.shareType;
            }
            cells.push(myCell);
            if(isDebug) inspector('myCell:', myCell);
          }
        });
      }
    }
  });
  return cells;
};

module.exports = {
  exeljsGetCellsFromFile,
};
