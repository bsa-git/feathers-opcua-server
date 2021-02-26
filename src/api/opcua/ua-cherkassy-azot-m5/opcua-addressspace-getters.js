/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');


const {
  appRoot,
  inspector,
} = require('../../../plugins/lib/util');

const {
  formatUAVariable,
  setValueFromSourceForGroup
} = require('../../../plugins/opcua/opcua-helper');

const {
  readOnlyNewFile,
  getPathBasename,
  createPath
} = require('../../../plugins/lib/file-operations');

const loForEach = require('lodash/forEach');

const debug = require('debug')('app:opcua-addressspace-getters');
const isDebug = false;
const isLog = false;

/**
 * @method histValueFromFileForCH_M51
 * @param {Object} params 
 * @param {Object} addedValue 
 */
function histValueFromFileForCH_M51(params = {}, addedValue) {
  const _path = 'test/data/tmp';
  let dataItems, dataType, results;
  let path = params.path ? params.path : _path;

  // Create path
  path = createPath(path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.file:'), chalk.cyan(filePath));
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M51.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  });
}

/**
 * @method histValueFromFileForCH_M52
 * @param {Object} params 
 * @param {Object} addedValue 
 */
function histValueFromFileForCH_M52(params = {}, addedValue) {
  const _path = 'test/data/tmp/ch-m51';
  let dataItems, groupVariable, dataType, browseName, results;
  let path = params.path ? params.path : _path;

  // Create path
  path = createPath(path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M52.file:'), chalk.cyan(filePath));
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M52.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M52.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  });
}

module.exports = {
  histValueFromFileForCH_M51,
  histValueFromFileForCH_M52,
};
