/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  formatUAVariable,
  getInitValueForDataType,
} = require('../opcua-helper');

const {
  DataType,
} = require('node-opcua');

const debug = require('debug')('app:getterPlugForVariable');
const isDebug = false;

//=============================================================================


/**
 * @method getterPlugForVariable
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {any}
 */
const getterPlugForVariable = function (params = {}, addedValue) {
  let value;
  //-----------------------------------------------
  if (isDebug) debug('getterPlugForVariable.params:', params);
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
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, module.exports, value);
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
};

module.exports = getterPlugForVariable;
