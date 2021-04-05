/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

const {
  appRoot,
  inspector,
  httpGetNewFileFromDir,
  readOnlyNewFile,
  readFileSync,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename,
  createPath
} = require('../lib');


const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

const {
  formatUAVariable,
  getInitValueForDataType,
  setValueFromSourceForGroup
} = require('./opcua-helper');

const {
  DataType,
} = require('node-opcua');

const loOmit = require('lodash/omit');

const debug = require('debug')('app:OPCUA_Getters');
const isDebug = false;
const isLog = false;

//=============================================================================

/**
 * @method getTValue
 * @param {Number} t 
 * @returns {Number}
 */
const getTValue = function (t) {
  let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
  return loRound(value, 3);
};


/**
 * @method plugForVariable
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {any}
 */
function plugForVariable(params = {}, addedValue) {
  let value;
  //-----------------------------------------------
  if (isDebug) debug('plugForVariable.params:', params);
  if (addedValue) {
    value = getInitValueForDataType(params.dataType);
    addedValue.setValueFromSource({ dataType: DataType[params.dataType], value });
    // Get group variable list 
    if (params.addedVariableList) {
      const groupVariableList = params.addedVariableList;
      if (isDebug) inspector('histValueFromFileForCH_M51.groupVariableList:', groupVariableList);
      // Set value from source for each groupVariable
      groupVariableList.forEach(groupVariable => {
        const browseName = formatUAVariable(groupVariable).browseName;
        const currentState = params.myOpcuaServer.getCurrentState();
        const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
        value = getInitValueForDataType(variable.dataType);
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, module.exports[variable.getter], value);
      });
    }
  } else {
    if (params.value) {
      value = params.value;
    } else {
      value = getInitValueForDataType(params.dataType);
    }
    return value;
  }
}

/**
 * @method valueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {String}
 */
function valueFromFile(params = {}, addedValue) {
  let dataItems, results;
  let id = params.myOpcuaServer.id;
  //------------------------------
  // Read file
  let csv = readFileSync([appRoot, '/src/api/opcua', id, params.fromFile]);
  results = papa.parse(csv, { delimiter: ';', header: true });
  loForEach(results.data[0], function (value, key) {
    results.data[0][key] = getTValue(value);
  });
  dataItems = results.data[0];
  if (isLog) inspector('valueFromFile.dataItems:', dataItems);
  // Set value from source for group 
  if (params.addedVariableList) {
    setValueFromSourceForGroup(params, dataItems, module.exports);
  }
  return JSON.stringify(dataItems);
}

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromFile(params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  const path = createPath(params.path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFile.dataItems:', dataItems);

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  });
  // Write file
  setInterval(function () {
    let csv = readFileSync([appRoot, '/src/api/opcua', id, params.fromFile]);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      loForEach(results.data[0], function (value, key) {
        results.data[0][key] = getTValue(value);
      });
      csv = papa.unparse(results.data, { delimiter: ';' });
      if (isLog) inspector('histValueFromFile.csv:', csv);
    }
    const fileName = getFileName('data-', 'csv', true);
    writeFileSync([path, fileName], csv);
  }, params.interval);
}

/**
 * @method histValueFromFileForCH_M51
 * @param {Object} params 
 * @param {Object} addedValue 
 */
function histValueFromPath(params = {}, addedValue) {
  let dataItems, dataType, results;
  //----------------------------------
  // Create path
  const path = createPath(params.path);

  // Watch read only new file
  readOnlyNewFile(path, (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromPath.file:'), chalk.cyan(filePath));
    if (isDebug) console.log(chalk.green('histValueFromPath.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromPath.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  });
}

/**
 * @method histValueFromHttpPath
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromHttpPath(params = {}, addedValue) {
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
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  };
  // Write file
  setInterval(async function () {
    const file = await httpGetNewFileFromDir(params.path);
    setValueFromSource(file.name, file.data);
  }, params.interval);
}

module.exports = {
  plugForVariable,
  valueFromFile,
  histValueFromFile,
  histValueFromPath,
  histValueFromHttpPath
};
