/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

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
const isLog = false;

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
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isDebug) console.log(chalk.green('fileName:'), chalk.cyan(fileName));
    if(isLog) inspector('histValueFromHttpPath.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
      setValueFromSourceForGroup(params, dataItems);
    }
  };
  // Write file
  setInterval(async function () {
    const file = await httpGetNewFileFromDir(params.path);
    setValueFromSource(file.name, file.data);
  }, params.interval);
};

module.exports = histValueFromHttpPath;
