/* eslint-disable no-unused-vars */
const moment = require('moment');
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../lib');

const {
  showInfoForHandler,
  runCommand,
} = require('./lib');

const isLog = false;

const functionBusy = {};

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedRunCommand(params, dataValue) {
  if (isLog && params) inspector('onChangedRunCommand.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isLog && dataValue) inspector('onChangedRunCommand.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;
  
  // Only for group values
  if(functionBusy[browseName]) return;
  
  // Set functionBusy to true
  functionBusy[browseName] = true;

  const startTime = moment.utc().format();
  if(isLog && startTime) console.log('onChangedRunCommand.startTime:', startTime, 'browseName:', browseName);

  // Run command
  await runCommand(params, dataValue);

  // Show info
  showInfoForHandler(params, dataValue);

  // Set functionBusy to true
  functionBusy[browseName] = false;

  const endTime = moment.utc().format();
  if(isLog && endTime) console.log('onChangedRunCommand.endTime:', endTime, 'browseName:', browseName);
}

module.exports = onChangedRunCommand;
