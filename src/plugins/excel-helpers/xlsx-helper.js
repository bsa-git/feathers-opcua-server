/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const Path = require('path');
const join = Path.join;
const {
  appRoot,
} = require('../lib/util');

const xlsx = require('xlsx')

const debug = require('debug')('app:xlsx-helper');
const isDebug = false;

//---------------- READ FILE -------------//

/**
 * @method eachCellFromFile
 * @param {String|Array} path
 * @param {String} sheetName
 * @returns {Array}
 */
const eachCellFromFile = function (path, sheetName = '') {
  let worksheet = null, cells = [];
  //--------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const file = xlsx.readFile(path);
  const sheets = file.SheetNames;
  // Get 
  sheets.forEach(function (sheet) {
    // Get worksheet
    if (sheetName && sheetName === sheet) {
      worksheet = file.Sheets[sheet];
    }

    if(!sheetName){
      worksheet = file.Sheets[sheet];
    }
    // Get eachCell for worksheet
    if (worksheet) {
      for (z in worksheet) {
        /* all keys that do not begin with "!" correspond to cell addresses */
        if (z[0] === '!') continue;
        cells.push({cell: `${sheet}!${z}`, value: JSON.stringify(worksheet[z].v)})
        if(isDebug) console.log('cells:', cells);
      }
    }
  });
  return cells;
};

module.exports = {
  eachCellFromFile,
};
