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
} = require('../lib');

const XLSX  = require('xlsx');

const debug = require('debug')('app:xlsx-helper');
const isDebug = false;

const typeOf = { n: 'number', s: 'string', b: 'boolean' };

//---------------- READ FILE -------------//

/**
 * @method xlsxGetCellsFromFile
 * @param {String|Array} path
 * @param {String} sheetName
 * @returns {Array}
 */
const xlsxGetCellsFromFile = function (path, sheetName = '') {
  let worksheet = null, myCell = {}, myItem = {}, cells = [];
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const workbook = XLSX.readFile(path);
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
        
        const columns = worksheet['!cols'];
        /* all keys that do not begin with "!" correspond to cell addresses */
        if (z[0] === '!') continue;
        
        myCell = {};
        myItem = worksheet[z];
        const isValidDateTime = (typeOf[myItem.t] === 'number') && myItem.w.includes(':');

        myCell.worksheetName = sheet;
        myCell.address = z;
        myCell.value = myItem.v;
        myCell.valueType = isValidDateTime? 'DateTime' : getValueType(myCell.value);
        if(myCell.valueType === 'DateTime'){
          myCell.value = myItem.w;
        }
        if(myCell.valueType === 'Number'){
          myCell.value = loRound(myItem.v, 3);
        }
        if(myItem.f){
          myCell.formula = myItem.f;
        }
        if(myItem.w){
          myCell.formatValue = myItem.w;
        }
        myCell.xlsx  = XLSX;
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
  return cells;
};

module.exports = {
  xlsxGetCellsFromFile,
};
