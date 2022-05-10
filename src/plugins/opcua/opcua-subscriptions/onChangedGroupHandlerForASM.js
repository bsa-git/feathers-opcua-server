/* eslint-disable no-unused-vars */
const moment = require('moment');
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  inspector,
  getTimeDuration,
  pause,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
} = require('./lib');

const ch_m5UpdateAcmYearReport = require('./lib/commands/ch_m5UpdateAcmYearReport');

const isDebug = false;

const functionBusy = {};

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {

  if (isDebug && params) inspector('onChangedGroupHandlerForASM.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;

  // Only for group values
  if (!addressSpaceOption.group) return;
  if (functionBusy[browseName]) return;

  // Set functionBusy to true
  functionBusy[browseName] = true;

  const startTime = moment.utc().format();
  if (isDebug && startTime) console.log('onChangedGroupHandlerForASM.startTime:', startTime, 'browseName:', browseName);

  try {
    // Save data to DB
    const savedValue = await saveOpcuaGroupValueToDB(params, dataValue);
    if (isDebug && savedValue) inspector('onChangedGroupHandlerForASM.savedValue:', savedValue);

    // Update year report
    await ch_m5UpdateAcmYearReport(params, dataValue);

    // await pause(100000);

    // Show info
    showInfoForGroupHandler(params, dataValue);

    // Set functionBusy to true
    functionBusy[browseName] = false;

    const endTime = moment.utc().format();
    const timeDuration = getTimeDuration(startTime, endTime);
    if (isDebug && endTime) console.log('onChangedGroupHandlerForASM.endTime:', endTime, 'browseName:', browseName);
    if (isDebug && timeDuration) console.log('onChangedGroupHandlerForASM.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'browseName:', chalk.cyan(browseName));

  } catch (error) {
    // Set functionBusy to false
    functionBusy[browseName] = false;
  }
}

module.exports = onChangedGroupHandlerForASM;
