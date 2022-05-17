/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');
const moment = require('moment');

const {
  inspector,
  httpGetNewFileFromDir,
} = require('../../lib');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:opcua-getters/histValueFromHttpPath');
const isDebug = false;

//=============================================================================

/**
 * @method histValueFromHttpPath
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const histValueFromHttpPath = function (params = {}, addedValue) {
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
    if(isDebug && dataItems) inspector('histValueFromHttpPath.dataItems:', dataItems);

    // Get dateTime from fileName
    dateTime = fileName.split('.')[0].split('-')[1];
    dateTime = moment.utc(dateTime, 'YYYYMMDD_HHmmss').format('YYYY-MM-DDTHH:mm:ss');
    if(isDebug && dateTime) inspector('histValueFromHttpPath.dateTime:', dateTime);

    // Add prop "!value": { dateTime: ''2022-05-17T13:22:56' } to dataItems
    dataItems['!value'] = { dateTime };
    if(isDebug && dataItems) inspector('histValueFromHttpPath.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  };
  // Write file
  setInterval(async function () {
    const file = await httpGetNewFileFromDir(params.path);
    if(file){
      setValueFromSource(file.name, file.data);
    }
  }, params.interval);
};

module.exports = histValueFromHttpPath;
