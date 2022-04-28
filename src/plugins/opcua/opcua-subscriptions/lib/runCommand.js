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

const {
  sessionCallMethod
} = require('./index');

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
  
  if (true && params) inspector('runCommand.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isLog && dataValue) inspector('runCommand.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('runCommand.formatDataValue:', dataValue);

  let options = dataValue.value.value;
  options = JSON.parse(options);
  if (!checkRunCommand(options)) {
    // Command error
    inspector('runCommand_ERROR.options:', options);
    throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  }

  // Run commands
  switch (options.command) {
  case 'ch-m5CreateAcmYearTemplate':
    inspector('runCommand.options:', options);

    break;

  default:
    break;
  }

}

module.exports = runCommand;
