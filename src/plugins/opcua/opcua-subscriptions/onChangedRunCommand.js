/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const loOmit = require('lodash/omit');
const loHead = require('lodash/head');
const loDrop = require('lodash/drop');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  inspector,
  pause,
  getTimeDuration
} = require('../../lib');

const {
  AuthServer
} = require('../../auth');

const {
  showInfoForHandler,
  runCommand,
  sessionWrite
} = require('./lib');

const {
  checkTokenQueueOfSubscribe,
  formatSimpleDataValue
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

    if (isDebug && params) inspector('onChangedRunCommand.params:', loOmit(params, ['myOpcuaClient']));
    if (isDebug && dataValue) inspector('onChangedRunCommand.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;
    // Get token
    let token = await AuthServer.getShortToken(8);
    token = `${browseName}(${token})`;
    if (isDebug && token) console.log('onChangedRunCommand.token:', token);
    if (isDebug && startTime) console.log('onChangedRunCommand.startTime:', startTime, 'token:', token);

    // Format simple DataValue
    dataValue = formatSimpleDataValue(dataValue);
    const statusCode = dataValue.statusCode.name;
    let value = dataValue.value.value;

    // Return else value is empty or (statusCode !== 'Good')
    if(statusCode !== 'Good' ||  !value) return;
    if (isDebug && value) inspector('onChangedRunCommand.value:', value);

    // Add subscribe to queue
    queueOfSubscribe.push({
      token,
      browseName,
      params,
      dataValue
    });

    if (isDebug && queueOfSubscribe.length) inspector('onChangedRunCommand.queueOfSubscribe:', queueOfSubscribe.map(s => s.token));

    // WaitTimeout
    do {
      result = checkTokenQueueOfSubscribe(queueOfSubscribe, token, false);
      if (result) await pause(1000, false);
    } while (result);

    // Get current subscribe
    const subscribe = loHead(queueOfSubscribe);
    params = subscribe.params;
    dataValue = subscribe.dataValue;

    // Run command
    const p1 = runCommand(params, dataValue);
    // Clear command
    const p2 = sessionWrite(params, { 
      attributeId: AttributeIds.Value,
      dataType: DataType.String, 
      value: '' 
    });

    // Show info
    Promise.all([p1, p2]).then(results => {
      
      if (isDebug && results.length) inspector('runCommand.results:', results[0]);
      if (isDebug && results.length) inspector('sessionWrite.results:', results[1]);
      
      // Show info
      showInfoForHandler(params, dataValue);
      // endTime and timeDuration
      const endTime = moment.utc().format();
      const timeDuration = getTimeDuration(startTime, endTime);
      if (isDebug && endTime) console.log('onChangedRunCommand.endTime:', endTime, 'token:', token);
      if (isDebug && timeDuration) console.log('onChangedRunCommand.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'token:', chalk.cyan(token));

      // Drop element from the beginning of array
      queueOfSubscribe = loDrop(queueOfSubscribe);
    });
  } catch (error) {
    // Drop element from the beginning of array
    queueOfSubscribe = loDrop(queueOfSubscribe);
  }
}

module.exports = onChangedRunCommand;
