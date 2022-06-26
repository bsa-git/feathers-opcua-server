/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

const {
  inspector,
  readOnlyNewFile,
  getDateTimeFromFileName,
  createPath
} = require('../../lib');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:getterHistValueFromPath');
const isDebug = false;
const isLog = false;

//=============================================================================

/**
 * @method getterHistValueFromPath
 * @param {Object} params 
 * @param {Object} addedValue 
 */
const getterHistValueFromPath = function (params = {}, addedValue) {
  let dataItems, dataType, results;
  //----------------------------------
  // Create path
  const path = createPath(params.path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('getterHistValueFromPath.file:'), chalk.cyan(filePath));
    if (isDebug) console.log(chalk.green('getterHistValueFromPath.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    
    // Get dateTime from fileName
    // e.g. data-20220518_075752.txt -> 2022-05-18T07:57:52
    const dateTime = getDateTimeFromFileName(filePath, [5], 'YYYYMMDD_HHmmss');
    if(isDebug && dateTime) inspector('getterHistValueFromPath.dateTime:', dateTime);

    // Add prop "!value": { dateTime: ''2022-05-17T13:22:56' } to dataItems
    dataItems['!value'] = { dateTime };
    if(isDebug && dataItems) inspector('getterHistValueFromPath.dataItems:', dataItems);
    
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('getterHistValueFromPath.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  });
};


module.exports = getterHistValueFromPath;
