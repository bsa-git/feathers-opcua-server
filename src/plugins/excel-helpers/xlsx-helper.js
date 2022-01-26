/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const Path = require('path');
const join = Path.join;
const {
  inspector,
} = require('../lib');

const xlsx = require('xlsx');

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
  const file = xlsx.readFile(path);
  const sheets = file.SheetNames;
  // Get 
  sheets.forEach(function (sheet) {
    worksheet = null;
    // Get worksheet
    if (sheetName && sheetName === sheet) {
      worksheet = file.Sheets[sheet];
    }

    if (!sheetName) {
      worksheet = file.Sheets[sheet];
    }
    // Get eachCell for worksheet
    if (worksheet) {
      for (let z in worksheet) {
        /* all keys that do not begin with "!" correspond to cell addresses */
        if (z[0] === '!') continue;

        myCell = {};
        myItem = worksheet[z];
        const isValidDateTime = (typeOf[myItem.t] === 'number') && myItem.w.includes(':');

        myCell.worksheet = sheet;
        myCell.cell = z;
        myCell.value = myItem.v;
        myCell.typeof = isValidDateTime? 'datetime' : typeOf[myItem.t];
        if(myCell.typeof === 'datetime'){
          myCell.value = myItem.w;
        }// loRound
        if(myCell.typeof === 'number'){
          myCell.value = loRound(myItem.v, 3);
        }
        myCell.valueToSting = myItem.w;
        // myCell.isValidDateTime = (myCell.typeof === 'number') && myCell.valueToSting.includes(':');
        if(myItem.f){
          myCell.formula = myItem.f;
        }
        cells.push(myCell);
        if(isDebug) inspector('myCell:', myCell);
      }
    }
  });
  return cells;
};

module.exports = {
  xlsxGetCellsFromFile,
};
