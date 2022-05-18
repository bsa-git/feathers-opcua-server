/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');

const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');
const loHead = require('lodash/head');
const loDrop = require('lodash/drop');
const loDelay = require('lodash/delay');

const {
  inspector,
  getTimeDuration,
  waitTimeout,
  waitTill,
  pause,
} = require('../../lib');

const {
  checkQueueOfSubscribe
} = require('../opcua-helper');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
} = require('./lib');

const ch_m5UpdateAcmYearReport = require('./lib/commands/ch_m5UpdateAcmYearReport');

const isDebug = false;

// Queue of subscribe
let queueOfSubscribe = [];


/**
 * @method onChangedGroupHandlerForASM
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {
  let result = false;
  //---------------------------------------------------------
  try {
    // Get startTime
    const startTime = moment.utc().format();
    if (isDebug && startTime) console.log('onChangedGroupHandlerForASM.startTime:', startTime, 'browseName:', browseName);

    if (isDebug && params) inspector('onChangedGroupHandlerForASM.params:', loOmit(params, ['myOpcuaClient', 'app']));
    if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;

    // Only for group values
    if (!addressSpaceOption.group) return;

    // Add subscribe to queue
    queueOfSubscribe.push({
      browseName,
      params,
      dataValue
    });


    if (isDebug && queueOfSubscribe.length)
      inspector('onChangedGroupHandlerForASM.queueOfSubscribe:', queueOfSubscribe.map(s => s.browseName));

    // WaitTimeout
    do {
      result = checkQueueOfSubscribe(queueOfSubscribe, browseName, false);
      if (result) await pause(1000, false);
    } while (result);

    // Get current subscribe
    const subscribe = loHead(queueOfSubscribe);
    params = subscribe.params;
    dataValue = subscribe.dataValue;

    // Save data to DB
    const p1 = saveOpcuaGroupValueToDB(params, dataValue);

    // Run update acm year report
    const p2 = ch_m5UpdateAcmYearReport(params, dataValue);

    // Show info
    Promise.all([p1, p2]).then(results => {

      if (isDebug && results.length) inspector('saveOpcuaGroupValueToDB.savedValue:', results[0]);
      if (isDebug && results.length) inspector('ch_m5UpdateAcmYearReport.readResult:', results[1]);

      // Show info
      showInfoForGroupHandler(params, dataValue);

      // endTime and timeDuration
      const endTime = moment.utc().format();
      const timeDuration = getTimeDuration(startTime, endTime);
      if (isDebug && endTime) console.log('onChangedGroupHandlerForASM.endTime:', endTime, 'browseName:', browseName);
      if (isDebug && timeDuration) console.log('onChangedGroupHandlerForASM.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'browseName:', chalk.cyan(browseName));

      // Drop element from the beginning of array
      queueOfSubscribe = loDrop(queueOfSubscribe);
    });
  } catch (error) {
    // Drop element from the beginning of array
    queueOfSubscribe = loDrop(queueOfSubscribe);
  }
}

module.exports = onChangedGroupHandlerForASM;
