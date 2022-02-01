/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

const {
  appRoot,
  inspector,
  readOnlyNewFile,
  readFileSync,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename,
  createPath,
  getRandomValue
} = require('../../lib');

const {
  xlsxGetCellsFromFile,
  xlsxWriteToFile,
  exeljsGetCellsFromFile
} = require('../../excel-helpers');

const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:opcua-getters/histValueFromFile');
const isDebug = true;
const isLog = false;


//=============================================================================

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const acmDayValueFromFile = function (params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  // debug('histValueFromFile.params.path:', params.path);
  const path = createPath(params.path);

  // Watch read only new file
  // readOnlyNewFile(path, (filePath, data) => {
  //   // Show filePath, data
  //   if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
  //   console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
  //   if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
  //   // Set value from source
  //   dataType = formatUAVariable(addedValue).dataType[1];
  //   results = papa.parse(data, { delimiter: ';', header: true });
  //   dataItems = results.data[0];
  //   dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
  //   addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

  //   if (isLog) inspector('histValueFromFile.dataItems:', dataItems);

  //   // Remove file 
  //   removeFileSync(filePath);

  //   // Set value from source for group 
  //   if (params.addedVariableList) {
  //     setValueFromSourceForGroup(params, dataItems);
  //   }
  // });

  // Write file
  // setInterval(function () {
  const cells = xlsxGetCellsFromFile([appRoot, '/src/api/opcua', id, params.fromFile], 'Report1');
  if (cells.length) {
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (isDebug && loStartsWith(cell.address, 'A')) {
        inspector('xls.cell:', loOmit(cell, ['xlsx', 'workbook', 'worksheet', 'cell']));
      }
    }
    const fileName = getFileName('DayHist01_14F120-', 'xls', true);
    // const XLSX = cells[0].xlsx;
    const workbook = cells[0].workbook;
    // XLSX.writeFile(workbook, 'out.xls');

    // xlsxWriteToFile([appRoot, params.path, fileName], workbook);
  }
  // }, params.interval);
};


module.exports = acmDayValueFromFile;
