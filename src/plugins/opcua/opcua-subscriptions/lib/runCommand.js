/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  checkRunCommand
} = require('../../opcua-client-scripts/lib');

const debug = require('debug')('app:runCommand');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function runCommand(params, dataValue) {
  let result;
  //----------------------------------
  if (isLog && params) inspector('runCommand.params:', loOmit(params, ['myOpcuaClient']));
  if (isLog && dataValue) inspector('runCommand.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('runCommand.formatDataValue:', dataValue);
  
  let options = dataValue.value.value;
  options = JSON.parse(options);
  if(!checkRunCommand(options)){
    // Command error
    inspector('runCommand.options:', options);
    throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  }
  const command = options.command;
  switch (command) {
    case 'ch-m5CreateAcmYearTemplate':
      
      break;
  
    default:
      break;
  }
  
}

module.exports = runCommand;
