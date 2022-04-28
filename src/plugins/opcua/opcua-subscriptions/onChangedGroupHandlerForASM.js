/* eslint-disable no-unused-vars */
const moment = require('moment');
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
  updateYearReportForASM
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
async function onChangedGroupHandlerForASM(params, dataValue) {
  if (isLog && params) inspector('onChangedGroupHandlerForASM.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isLog && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;
  
  // Only for group values
  if (!addressSpaceOption.group) return;
  if(functionBusy[browseName]) return;
  
  // Set functionBusy to true
  functionBusy[browseName] = true;

  const startTime = moment.utc().format();
  if(isLog && startTime) console.log('onChangedGroupHandlerForASM.startTime:', startTime, 'browseName:', browseName);

  // Save data to DB
  const savedValue = await saveOpcuaGroupValueToDB(params, dataValue);
  if (isLog && savedValue) inspector('onChangedGroupHandlerForASM.savedValue:', savedValue);

  // Update year report
  await updateYearReportForASM(params, dataValue);

  // Show info
  showInfoForGroupHandler(params, dataValue);

  // Set functionBusy to true
  functionBusy[browseName] = false;

  const endTime = moment.utc().format();
  if(isLog && endTime) console.log('onChangedGroupHandlerForASM.endTime:', endTime, 'browseName:', browseName);
}

module.exports = onChangedGroupHandlerForASM;
