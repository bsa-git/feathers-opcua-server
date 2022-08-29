/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');
const moment = require('moment');

const {
  inspector,
  httpGetNewFileFromDir,
  getDateTimeFromFileName,
  addIntervalId
} = require('../../lib');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:getterHistValueFromHttpPath');
const isDebug = false;

//=============================================================================

/**
 * @method getterHistValueFromHttpPath
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const getterHistValueFromHttpPath = function (params = {}, addedValue) {
  let dataItems, dataType, results;
  
  // Set value from source
  const setValueFromSource = (fileName, data) => {
    let dateTime = '';
    //-------------------------------------
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isDebug && fileName) console.log(chalk.green('fileName:'), chalk.cyan(fileName));
    if(isDebug && dataItems) inspector('getterHistValueFromHttpPath.dataItems:', dataItems);

    // Get dateTime from fileName
    // e.g. data-20220518_075752.txt -> 2022-05-18T07:57:52
    dateTime = getDateTimeFromFileName(fileName, [5], 'YYYYMMDD_HHmmss');
    if(isDebug && dateTime) inspector('getterHistValueFromHttpPath.dateTime:', dateTime);

    // Add prop "!value": { dateTime: ''2022-05-17T13:22:56' } to dataItems
    dataItems['!value'] = { dateTime };
    if(isDebug && dataItems) inspector('getterHistValueFromHttpPath.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  };

  // Set interval
  const intervalId = setInterval(async function () {
    const file = await httpGetNewFileFromDir(params.path);
    if(file){
      setValueFromSource(file.name, file.data);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
};

module.exports = getterHistValueFromHttpPath;
