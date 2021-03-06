/* eslint-disable no-unused-vars */
const os = require('os');
const {
  Variant,
  DataType,
} = require('node-opcua');

const chalk = require('chalk');

const {
  appRoot,
  getTime,
  inspector,
} = require('../../../plugins/lib/util');

const {
  formatUAVariable,
  setValueFromSourceForGroup
} = require('../../../plugins/opcua/opcua-helper');

const {
  readOnlyNewFile,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename
} = require('../../../plugins/lib/file-operations');

const opcuaDefaultGetters = require('../../../plugins/opcua/opcua-getters');

const loRound = require('lodash/round');

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
 * Simulate for value
 * @param {Object} params 
 * @returns {Variant}
 */
function valueSimulate1(params = {}) {
  const t = new Date() / 10000;
  let value = params.value ? params.value : 10;
  value = value + 10 * Math.sin(t);
  return new Variant({ dataType: DataType.Double, value: value });
}

/**
 * Get value from source1
 * @param {Object} params 
 * @returns {Object}
 */
function valueFromSource1(params = {}) {
  const defValue = 'https://leanpub.com/node-opcuabyexample';
  const value = `Learn Node-OPCUA ! Read ${params.value ? params.value : defValue}`;
  return value;
}

/**
 * Get value from source2
 * @param {Object} params 
 * @returns {Object}
 */
function valueFromSource2(params = {}) {
  const defValue = [1.0, 2.0, 3.0];
  const value = params.value ? params.value : defValue;
  return value;
}

/**
 * Get hist value from source
 * @param {Object} params 
 * @param {Object} addedValue 
 */
function histValueFromSource(params = {}, addedValue) {
  // simulate pressure change
  const _t = 0;
  const _interval = 200;
  let t = params.t ? params.t : _t;
  let interval = params.interval ? params.interval : _interval;
  setInterval(function () {
    let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
    if (isDebug) debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime());
    // debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime()); 
    addedValue.setValueFromSource({ dataType: DataType.Double, value: value });
    t = t + 1;
  }, interval);
}

function histValueFromFile(params = {}, addedValue) {
  const _t = 0;
  const _interval = 200;
  const _path = 'test/data/tmp';
  let dataItems, groupVariable, dataType, browseName;
  let t = params.t ? params.t : _t;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;

  // Watch read only new file
  readOnlyNewFile([appRoot, path], (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    // console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    // console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    addedValue.setValueFromSource({ dataType, value: data });

    if (isLog) inspector('histValueFromFile.addedValue:', formatUAVariable(addedValue));

    // Remove file 
    removeFileSync(filePath);

    // Get data
    // e.g. [{ name: '02NG_F5', value: 10.234 }, { name: '02NG_P5', value: 2.444 }] => { "02NG_F5": 10.234, "02NG_P5": 2.444 }
    let dataItem = {};
    dataItems = JSON.parse(data);
    dataItems.forEach(item => {
      Object.assign(dataItem, {[item.name]: item.value});
    });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItem, module.exports);
    }
  });
  // Write file
  setInterval(function () {
    const data = [
      {
        name: '02NG_F5',
        value: getTValue(t)
      },
      {
        name: '02NG_P5',
        value: getTValue(t)
      }
    ];
    const fileName = getFileName('data-', 'json', true);
    writeFileSync([appRoot, path, fileName], data, true);
    t = t + 1;
  }, interval);
}



/**
 * Get percentage memory used
 * @returns {Variant}
 */
function percentageMemUsed() {
  const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
  const value = percentageMemUsed * 100;
  return new Variant({ dataType: DataType.Double, value: value });
}

module.exports = Object.assign({}, opcuaDefaultGetters, {
  valueSimulate1,
  valueFromSource1,
  valueFromSource2,
  histValueFromSource,
  histValueFromFile,
  percentageMemUsed
});
