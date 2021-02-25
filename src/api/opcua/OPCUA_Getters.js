/* eslint-disable no-unused-vars */
const {
  formatUAVariable,
  getInitValueForDataType
} = require('../../plugins/opcua/opcua-helper');

const {
  DataType,
} = require('node-opcua');

const loOmit = require('lodash/omit');

const debug = require('debug')('app:OPCUA_Getters');
const isDebug = false;


/**
 * @method histPlugForGroupVariables
 * 
 * @param {Object} params
 * @param {Object} addedValue 
 */
function histPlugForGroupVariables(params = {}) {
  params = loOmit(params, ['myOpcuaServer']);
  if (isDebug) debug('histPlugForGroupVariables.params:', params);
  return params.value ? params.value : undefined;
}

/**
 * @method plugForVariable
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {any}
 */
function plugForVariable(params = {}, addedValue) {
  let value;
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
      })
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

module.exports = {
  plugForVariable,
  histPlugForGroupVariables,
};
