/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');

const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');

const {
  inspector,
  getTimeDuration,
  waitTimeout,
  pause,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
} = require('./lib');

const ch_m5UpdateAcmYearReport = require('./lib/commands/ch_m5UpdateAcmYearReport');

const isDebug = false;

const functionBusy = {};
const tagQueueData = [];

/**
 * checkFunctionBusy
 * @param {String} browseName
 * @returns {Boolean}
 * e.g. if functionBusy -> { tag1: true, ... , tagN: false } then return false
 * e.g. if functionBusy -> { tag1: false, ... , tagN: false } then return true
 */
const checkFunctionBusy = (browseName) => {
  let isBusy = false;
  //---------------------------
  loForEach(functionBusy, function (value, key) {
    if (key !== browseName && !isBusy) {
      isBusy = value;
      if(isDebug && isBusy) console.log(`${browseName} wait:'`, key);
    }
  });
  return isBusy;
};

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {
  let result = false;
  //---------------------------------------------------------
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
    // waitTimeout(checkFunctionBusy, browseName);
    do {
      result = checkFunctionBusy(browseName);
      if(result) await pause(1000, false);
    } while (result);
    // Run update acm year report
    await ch_m5UpdateAcmYearReport(params, dataValue);

    // await pause(10000);

    // Show info
    showInfoForGroupHandler(params, dataValue);

    // Set functionBusy to true
    functionBusy[browseName] = false;

    const endTime = moment.utc().format();
    const timeDuration = getTimeDuration(startTime, endTime);
    if (isDebug && endTime) console.log('onChangedGroupHandlerForASM.endTime:', endTime, 'browseName:', browseName);
    if (true && timeDuration) console.log('onChangedGroupHandlerForASM.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'browseName:', chalk.cyan(browseName));

  } catch (error) {
    // Set functionBusy to false
    functionBusy[browseName] = false;
  }
}

module.exports = onChangedGroupHandlerForASM;
