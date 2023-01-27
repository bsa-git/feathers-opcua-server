/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');

const loOmit = require('lodash/omit');

const {
  inspector,
  getTimeDuration,
  sysMemUsage,
  Queue
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
  saveStoreOpcuaGroupValueToDB
} = require('./lib');

const ch_m5UpdateAcmYearReport = require('./lib/commands/ch_m5UpdateAcmYearReport');

const isDebug = false;

/**
 * @method onChangedGroupHandlerForASM
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {
  let result = false, isQueue = false, queue = null;
  //---------------------------------------------------------
  try {

    const memUsed = sysMemUsage().percentageMemUsed;
    if (isDebug && memUsed) console.log('Percentage Mem Used:', `${memUsed}%`);

    // Get startTime
    const startTime = moment.utc().format();
    if (isDebug && startTime) console.log('onChangedGroupHandlerForASM.startTime:', startTime, 'browseName:', browseName);

    if (isDebug && params) inspector('onChangedGroupHandlerForASM.params:', loOmit(params, ['myOpcuaClient']));
    if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;
    isQueue = (addressSpaceOption.getterParams.isQueue !== undefined) ? addressSpaceOption.getterParams.isQueue : true;

    // Only for group values
    if (!addressSpaceOption.group) return;

    // Create queue
    if (isQueue) {
    queue = new Queue(browseName, 'excel-list');
    await queue.doWhile();
    }

    // Save data to DB
    const p1 = saveOpcuaGroupValueToDB(params, dataValue);

    // Save data to store DB
    const p2 = saveStoreOpcuaGroupValueToDB(params, dataValue);

    // Run update acm year report
    // const p3 = ch_m5UpdateAcmYearReport(params, dataValue);

    // Show info
    Promise.all([p1, p2, 'p3']).then(results => {

      if (isDebug && results.length) inspector('saveOpcuaGroupValueToDB.savedValue:', results[0]);
      if (isDebug && results.length) inspector('saveStoreOpcuaGroupValueToDB.savedValue:', results[1]);
      if (isDebug && results.length) inspector('ch_m5UpdateAcmYearReport.readResult:', results[2]);

      // Show info
      showInfoForGroupHandler(params, dataValue);

      // endTime and timeDuration
      const endTime = moment.utc().format();
      const timeDuration = getTimeDuration(startTime, endTime);
      if (isDebug && endTime) console.log('onChangedGroupHandlerForASM.endTime:', endTime, 'browseName:', browseName);
      if (isDebug && timeDuration) console.log('onChangedGroupHandlerForASM.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'browseName:', chalk.cyan(browseName));

      // Drop item from the beginning of array
      if (isQueue) queue.dropCurrentItem();
    });
  } catch (error) {
    console.log(error.message);
    // Drop item from the beginning of array
    if(isQueue && queue) queue.dropCurrentItem();
    inspector(chalk.red('onChangedGroupHandlerForASM.Error:'), error);
  }
}

module.exports = onChangedGroupHandlerForASM;
