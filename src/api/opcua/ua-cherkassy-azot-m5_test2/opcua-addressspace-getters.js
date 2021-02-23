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
  readFileSync,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename,
  makeDirSync,
  createPath
} = require('../../../plugins/lib/file-operations');

const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const loStartsWith = require('lodash/startsWith');


const debug = require('debug')('app:opcua-addressspace-getters');
const isDebug = false;
const isLog = false;

/**
 * @method getTValue
 * @param {Number} t 
 * @returns {Number}
 */
const getTValue = function (t) {
  let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
  return loRound(value, 3);
};

function histValueFromFileForCH_M51(params = {}, addedValue) {
  const _interval = 200;
  const _path = '/test/data/tmp/ch-m51';
  let dataItems, groupVariable, dataType, browseName, results;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let id = params.myOpcuaServer.id;

  // Exit 
  if(!params.hist){
    return params.value? params.value : id;
  }

  // Create path
  path = createPath(path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {  
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFileForCH_M51.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M51.dataItems:', dataItems);
    // inspector('histValueFromFileForCH_M51.dataItems:', dataItems);

    // Remove file 
    removeFileSync(filePath);

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
  // Write file
  setInterval(function () {
    let csv = readFileSync([appRoot, '/src/api/opcua', id, 'data-CH_M51.csv']);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      loForEach(results.data[0], function (value, key) {
        results.data[0][key] = getTValue(value);
      });
      csv = papa.unparse(results.data, { delimiter: ';' });
      if (isLog) inspector('histValueFromFileForCH_M51.csv:', csv);
    }
    const fileName = getFileName('data-', 'csv', true);
    writeFileSync([path, fileName], csv);
  }, interval);
}

function histValueFromFileForCH_M52(params = {}, addedValue) {
  const _interval = 200;
  const _path = '/test/data/tmp/ch-m52';
  let dataItems, groupVariable, dataType, browseName, results;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let id = params.myOpcuaServer.id;

  // Exit 
  if(!params.hist){
    return params.value? params.value : id;
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

    // Remove file 
    removeFileSync(filePath);

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
        // console.log(chalk.green(`histValueFromFileForCH_M52.${browseName}:`), chalk.cyan(value));
      }
    });
  });
  // Write file
  setInterval(function () {
    let csv = readFileSync([appRoot, '/src/api/opcua', id, 'data-CH_M52.csv']);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      loForEach(results.data[0], function (value, key) {
        results.data[0][key] = getTValue(value);
      });
      csv = papa.unparse(results.data, { delimiter: ';' });
      if (isLog) inspector('histValueFromFileForCH_M52.csv:', csv);
    }
    const fileName = getFileName('data-', 'csv', true);
    writeFileSync([path, fileName], csv);
  }, interval);
}

module.exports = {
  histValueFromFileForCH_M51,
  histValueFromFileForCH_M52,
};
