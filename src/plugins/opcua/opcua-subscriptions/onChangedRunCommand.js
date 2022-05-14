/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const loOmit = require('lodash/omit');
const loHead = require('lodash/head');
const loDrop = require('lodash/drop');

const {
  inspector,
  pause,
  getTimeDuration
} = require('../../lib');

const {
  showInfoForHandler,
  runCommand,
} = require('./lib');

const {
  checkQueueOfSubscribe
} = require('../opcua-helper');

const isDebug = false;

// Queue of subscribe
let queueOfSubscribe = [];

/**
 * @method onChangedRunCommand
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedRunCommand(params, dataValue) {
  let result = false;
  //-----------------------------------------
  try {

    // Get startTime
    const startTime = moment.utc().format();
    if (isDebug && startTime) console.log('onChangedRunCommand.startTime:', startTime, 'browseName:', browseName);
    
    if (isDebug && params) inspector('onChangedRunCommand.params:', loOmit(params, ['myOpcuaClient', 'app']));
    if (isDebug && dataValue) inspector('onChangedRunCommand.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;

    // Add subscribe to queue
    queueOfSubscribe.push({
      browseName,
      params,
      dataValue
    });

    // WaitTimeout
    do {
      result = checkQueueOfSubscribe(queueOfSubscribe, browseName, false);
      if (result) await pause(1000, false);
    } while (result);

    if (true && queueOfSubscribe.length) inspector('onChangedRunCommand.queueOfSubscribe:', queueOfSubscribe.map(s => s.browseName));

    // Get current subscribe
    const subscribe = loHead(queueOfSubscribe);
    params = subscribe.params;
    dataValue = subscribe.dataValue;

    // Run command
    const p1 = runCommand(params, dataValue);

    // Show info
    Promise.all([p1, 'p2']).then(results => {
      
      if (isDebug && results.length) inspector('onChangedRunCommand.savedValue:', results[0]);
      
      // Show info
      showInfoForHandler(params, dataValue);

      // endTime and timeDuration
      const endTime = moment.utc().format();
      const timeDuration = getTimeDuration(startTime, endTime);
      if (isDebug && endTime) console.log('onChangedRunCommand.endTime:', endTime, 'browseName:', browseName);
      if (isDebug && timeDuration) console.log('onChangedRunCommand.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'browseName:', chalk.cyan(browseName));

      // Drop element from the beginning of array
      queueOfSubscribe = loDrop(queueOfSubscribe);
    });
  } catch (error) {
    // Drop element from the beginning of array
    queueOfSubscribe = loDrop(queueOfSubscribe);
  }
}

module.exports = onChangedRunCommand;
