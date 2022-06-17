/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const os = require('os');

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
  saveStoreOpcuaGroupValueToDB
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
  let result = false, isQueue = false;
  //---------------------------------------------------------
  try {

    console.log('Free Memory ' + String(os.freemem())
    + ' Bytes out of ' + String(os.totalmem()) + ' Bytes');
    // const totalmem = os.totalmem();
    // const freemem = os.freemem();
    // const percentageMemUsed = (totalmem > 0)? 1.0 - (freemem / totalmem) : `freemem=${freemem}; totalmem=${totalmem}`;
    // const value = (totalmem > 0)? percentageMemUsed * 100 : percentageMemUsed;
    // if (true && value) console.log('onChangedGroupHandlerForASM.percentageMemUsed:', startTime, 'browseName:', value);

    // Get startTime
    const startTime = moment.utc().format();
    if (isDebug && startTime) console.log('onChangedGroupHandlerForASM.startTime:', startTime, 'browseName:', browseName);

    if (isDebug && params) inspector('onChangedGroupHandlerForASM.params:', loOmit(params, ['myOpcuaClient', 'app']));
    if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;
    isQueue = !!addressSpaceOption.getterParams.isQueue;

    // Only for group values
    if (!addressSpaceOption.group) return;

    // Add subscribe to queue
    if (isQueue) queueOfSubscribe.push({
      browseName,
      params,
      dataValue
    });


    if (isDebug && queueOfSubscribe.length)
      inspector('onChangedGroupHandlerForASM.queueOfSubscribe:', queueOfSubscribe.map(s => s.browseName));

    // WaitTimeout
    if (isQueue) do {
      result = checkQueueOfSubscribe(queueOfSubscribe, browseName, false);
      if (result) await pause(1000, false);
    } while (result);

    // Get current subscribe
    if (isQueue) {
      const subscribe = loHead(queueOfSubscribe);
      params = subscribe.params;
      dataValue = subscribe.dataValue;
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

      // Drop element from the beginning of array
      if (isQueue) queueOfSubscribe = loDrop(queueOfSubscribe);
    });
  } catch (error) {
    console.log(error.message);
    // Drop element from the beginning of array
    if (isQueue) queueOfSubscribe = loDrop(queueOfSubscribe);
  }
}

module.exports = onChangedGroupHandlerForASM;
