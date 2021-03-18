/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

const {
  formatUAVariable,
  setValueFromSourceForGroup
} = require('../../../plugins/opcua/opcua-helper');

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
} = require('../../../plugins');

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

/**
 * @method histValueFromFileForCH_M51
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromFileForCH_M51(params = {}, addedValue) {
  const _interval = 200;
  const _path = '/test/data/tmp/ch-m51';
  let dataItems, groupVariable, dataType, browseName, results;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let id = params.myOpcuaServer.id;

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

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
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

/**
 * @method histValueFromFileForCH_M51
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromFileForCH_M52(params = {}, addedValue) {
  const _interval = 200;
  const _path = '/test/data/tmp/ch-m52';
  let dataItems, groupVariable, dataType, browseName, results;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let id = params.myOpcuaServer.id;

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

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
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

/**
 * @method histValueFromHttpForCH_M52
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromHttpForCH_M52(params = {}, addedValue) {
  let dataItems, dataType, results;
  
  // Set value from source
  const setValueFromSource = (fileName, data) => {
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isDebug) console.log(chalk.green('fileName:'), chalk.cyan(fileName));
    if(isLog) inspector('histValueFromHttpForCH_M52.dataItems:', dataItems);

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

/**
 * @method histValueFromFileForCH_M51
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function valueFromFileForCH_M52(params = {}, addedValue) {
  let dataItems, results;
  let id = params.myOpcuaServer.id;

  // Read file
  let csv = readFileSync([appRoot, '/src/api/opcua', id, 'data-CH_M52.csv']);
  results = papa.parse(csv, { delimiter: ';', header: true });
  loForEach(results.data[0], function (value, key) {
    results.data[0][key] = getTValue(value);
  });
  dataItems = results.data[0];
  if (isLog) inspector('valueFromFileForCH_M52.dataItems:', dataItems);
  // Set value from source for group 
  if (params.addedVariableList) {
    setValueFromSourceForGroup(params, dataItems, module.exports);
  }
  return JSON.stringify(dataItems);
}

module.exports = {
  histValueFromFileForCH_M51,
  histValueFromFileForCH_M52,
  histValueFromHttpForCH_M52,
  valueFromFileForCH_M52
};
