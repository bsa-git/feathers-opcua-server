/* eslint-disable no-unused-vars */
const os = require('os');
const {
  Variant,
  DataType,
  // StatusCodes,
  // VariantArrayType,
  // standardUnits,
  // makeAccessLevelFlag,
} = require('node-opcua');

const chalk = require('chalk');

const {
  appRoot,
  getTime,
  inspector,
} = require('../../../plugins/lib/util');

const {
  convertTo,
  formatUAVariable
} = require('../../../plugins/opcua/opcua-helper');

const {
  readOnlyNewFile,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename
} = require('../../../plugins/lib/file-operations');

const loRound = require('lodash/round');
const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');
const moment = require('moment');
const { pause } = require('../../../plugins/lib');

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
 * @method histPlugForGroupVariables
 * 
 * @param {Object} params
 * @param {Object} addedValue 
 */
function histPlugForGroupVariables(params = {}) {
  params = loOmit(params, ['myOpcuaServer']);
  if (isDebug) debug('histPlugForGroupVariables.params:', params);
  return params.value ? params.value : null;
}

/**
 * @method converterForVariable
 * @param {Object} params 
 * @returns {any}
 */
function converterForVariable(params = {}) {
  let value = null;
  params = loOmit(params, ['myOpcuaServer']);
  if (isDebug) debug('histPlugForGroupVariables.params:', params);
  if (params.value && params.convertType) {
    value = convertTo(params.convertType, params.value);
  }
  return value;
}

function histValueFromFileForCH_M51(params = {}, addedValue) {
  const _t = 0;
  const _interval = 200;
  const _path = 'test/data/tmp';
  const _hist = true;
  let dataItems, groupVariable, dataType, browseName;
  let t = params.t ? params.t : _t;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let hist = params.hist === undefined ? _hist : params.hist;

  if (hist) {
    // Watch read only new file
    readOnlyNewFile([appRoot, path], (filePath, data) => {
      // Show filePath, data
      if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
      if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
      // Set value from source
      dataType = formatUAVariable(addedValue).dataType[1];
      addedValue.setValueFromSource({ dataType, value: data });

      if (isLog) inspector('histValueFromFile.addedValue:', formatUAVariable(addedValue));
      // inspector('histValueFromFile.addedValue:', formatUAVariable(addedValue));

      // Remove file 
      removeFileSync(filePath);

      // Get data
      dataItems = JSON.parse(data);
      // Get group variable list 
      const groupVariableList = params.addedVariableList;
      if (isDebug) inspector('histValueFromFile.groupVariableList:', groupVariableList);

      dataItems.forEach(dataItem => {
        groupVariable = groupVariableList.find(v => v.browseName.name === dataItem.name);
        // Set value from source
        if (groupVariable) {
          browseName = formatUAVariable(groupVariable).browseName;

          // Run setValueFromSource for groupVariable
          const currentState = params.myOpcuaServer.getCurrentState();
          const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
          params.myOpcuaServer.setValueFromSource(variable, groupVariable, module.exports[variable.getter], dataItem.value);

          if (isDebug) console.log(chalk.green(`histValueFromFile.${browseName}:`), chalk.cyan(dataItem.value));
        }
      });

    });
    // Write file
    setInterval(function () {
      const data = [
        {
          name: 'Device2.02F5',
          value: getTValue(t)
        },
        {
          name: 'Device2.02P5',
          value: getTValue(t)
        }
      ];
      const fileName = getFileName('data-', 'json', true);
      writeFileSync([appRoot, path, fileName], data, true);
      t = t + 1;
    }, interval);
  } else{
    
  }


}

module.exports = {
  histPlugForGroupVariables,
  converterForVariable,
  histValueFromFileForCH_M51,
};
