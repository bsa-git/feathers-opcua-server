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
  getDateTimeFromFileName,
  getPathBasename,
  createPath,
  getRandomValue
} = require('../../lib');

const loForEach = require('lodash/forEach');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:opcua-getters/histValueFromFile');
const isDebug = false;

//=============================================================================

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const histValueFromFile = function (params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  // debug('histValueFromFile.params.path:', params.path);
  const path = createPath(params.path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    // console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    
    // Get dateTime from fileName
    // e.g. data-20220518_075752.txt -> 2022-05-18T07:57:52
    const dateTime = getDateTimeFromFileName(filePath, [5], 'YYYYMMDD_HHmmss');
    if(isDebug && dateTime) inspector('histValueFromFile.dateTime:', dateTime);

    // Add prop "!value": { dateTime: ''2022-05-17T13:22:56' } to dataItems
    dataItems['!value'] = { dateTime };
    if(isDebug && dataItems) inspector('histValueFromHttpPath.dataItems:', dataItems);
    
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  });
  // Write file
  setInterval(function () {
    let csv = readFileSync([appRoot, params.fromFile]);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      loForEach(results.data[0], function (value, key) {
        results.data[0][key] = getRandomValue(value);
      });
      csv = papa.unparse(results.data, { delimiter: ';' });
      if (isDebug) inspector('histValueFromFile.csv:', csv);
    }
    const fileName = getFileName('data-', 'csv', true);
    writeFileSync([path, fileName], csv);
  }, params.interval);
};


module.exports = histValueFromFile;
