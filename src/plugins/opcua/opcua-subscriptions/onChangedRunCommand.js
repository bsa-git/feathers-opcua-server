/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const loOmit = require('lodash/omit');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  inspector,
  logger,
  getShortToken,
  Queue
} = require('../../lib');

const {
  showInfoForHandler,
  runCommand,
  sessionWrite
} = require('./lib');

const {
  formatSimpleDataValue
} = require('../opcua-helper');

const isDebug = false;

/**
 * @method onChangedRunCommand
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedRunCommand(params, dataValue) {
  let queue = null;
  //-----------------------------------------
  try {

    // Get startTime
    const startTime = moment.utc().format();

    if (isDebug && params) inspector('onChangedRunCommand.params:', loOmit(params, ['myOpcuaClient']));
    if (isDebug && dataValue) inspector('onChangedRunCommand.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    const browseName = addressSpaceOption.browseName;
    // Get token
    let token = getShortToken(8);
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

    // Create queue and while
    queue = new Queue(browseName, 'runCommand-list');
    await queue.doWhile();

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
      
      // Drop item from the beginning of array
      queue.dropCurrentItem();
    });
  } catch (error) {
    // Drop item from the beginning of array
    if(queue) queue.dropCurrentItem();
    const errorMessage = error.message? error.message : error;
    logger.error(`onChangedKepValue.Error: "${errorMessage}"`);
  }
}

module.exports = onChangedRunCommand;
