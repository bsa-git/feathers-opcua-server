/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');


const {
  appRoot,
  inspector,
} = require('../../../plugins/lib/util');

const {
  formatUAVariable
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
  let dataItems, groupVariable, dataType, browseName, results;
  let path = params.path ? params.path : _path;
  // let id = params.myOpcuaServer.id;

  // Exit 
  if(!params.hist){
    return params.value? params.value : '';
  }

  // Create path
  path = createPath(path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.file:'), chalk.cyan(getPathBasename(filePath)));
    console.log(chalk.green('histValueFromFileForCH_M51.file:'), chalk.cyan(filePath));
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M51.dataItems:', dataItems);
    inspector('histValueFromFileForCH_M51.dataItems:', dataItems);
    // inspector('histValueFromFileForCH_M51.dataItems:', dataItems);

    // Get group variable list 
    const groupVariableList = params.addedVariableList;
    if (isDebug) inspector('histValueFromFileForCH_M51.groupVariableList:', groupVariableList);

    loForEach(dataItems, function (value, key) {
      groupVariable = groupVariableList.find(v => v.aliasName === key);
      // Set value from source
      if (groupVariable) {
        browseName = formatUAVariable(groupVariable).browseName;

        // Run setValueFromSource for groupVariable
        const currentState = params.myOpcuaServer.getCurrentState();
        const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, module.exports[variable.getter], value);

        if (isDebug) console.log(chalk.green(`histValueFromFileForCH_M51.${browseName}:`), chalk.cyan(value));
      }
    });

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
  // let id = params.myOpcuaServer.id;

  // Exit 
  if(!params.hist){
    return params.value? params.value : '';
  }

  // Create path
  path = createPath(path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M52.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M52.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M52.dataItems:', dataItems);
    // inspector('histValueFromFileForCH_M52.dataItems:', dataItems);

    // Get group variable list 
    const groupVariableList = params.addedVariableList;
    if (isDebug) inspector('histValueFromFileForCH_M52.groupVariableList:', groupVariableList);

    loForEach(dataItems, function (value, key) {
      groupVariable = groupVariableList.find(v => v.aliasName === key);
      // Set value from source
      if (groupVariable) {
        browseName = formatUAVariable(groupVariable).browseName;

        // Run setValueFromSource for groupVariable
        const currentState = params.myOpcuaServer.getCurrentState();
        const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, module.exports[variable.getter], value);

        if (isDebug) console.log(chalk.green(`histValueFromFileForCH_M52.${browseName}:`), chalk.cyan(value));
      }
    });

  });
}

module.exports = {
  histValueFromFileForCH_M51,
  histValueFromFileForCH_M52,
};
