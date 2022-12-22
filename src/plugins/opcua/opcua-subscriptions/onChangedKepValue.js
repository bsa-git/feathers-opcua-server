/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const loOmit = require('lodash/omit');
const loHead = require('lodash/head');
const loDrop = require('lodash/drop');

const {
  inspector,
  logger,
  pause,
  getTimeDuration,
  isFunction
} = require('../../lib');

const {
  AuthServer
} = require('../../auth');

// const {
//   showInfoForHandler,
//   showInfoForGroupHandler,
//   saveOpcuaGroupValueToDB,
//   runCommand,
//   sessionWrite
// } = require('./lib');

const libs = require('./lib');

const {
  checkTokenQueueOfSubscribe,
  formatSimpleDataValue
} = require('../opcua-helper');

const isDebug = false;

// Queue of subscribe
let queueOfSubscribe = [];

/**
 * @method onChangedKepValue
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedKepValue(params, dataValue) {
  let ownerGroupVariable, resultSubscribeFuncs = [], result = false;
  //------------------------------------------------------------
  try {

    // Get startTime
    const startTime = moment.utc().format();

    if (isDebug && params) inspector('onChangedKepValue.params:', loOmit(params, ['myOpcuaClient']));
    if (isDebug && dataValue) inspector('onChangedKepValue.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;
    const browseName = addressSpaceOption.browseName;
    const ownerGroupName = addressSpaceOption.ownerGroup ? addressSpaceOption.ownerGroup : browseName;

    if (ownerGroupName !== browseName) {
      // Get srvCurrentState 
      const srvCurrentState = await params.myOpcuaClient.getSrvCurrentState(params.id);
      if (isDebug && srvCurrentState) inspector('subscriptionMonitor.srvCurrentState:', srvCurrentState);
      const allVariables = srvCurrentState.paramsAddressSpace.variables;
      if (isDebug && allVariables.length) inspector('startSubscriptionMonitor.allVariables:', allVariables);
      ownerGroupVariable = allVariables.find(v => v.browseName === ownerGroupName);
    } else {
      ownerGroupVariable = addressSpaceOption;
    }

    // Get subscribeParams
    const subscribeParams = ownerGroupVariable.subscribeParams ? ownerGroupVariable.subscribeParams : null;
    if (isDebug && subscribeParams) inspector('onChangedKepValue.subscribeParams:', subscribeParams);

    // Set subscribeParams for addressSpaceOption
    if(!addressSpaceOption.subscribeParams) addressSpaceOption.subscribeParams = subscribeParams;

    // Get token
    let token = await AuthServer.getShortToken(8);
    token = `${browseName}(${token})`;
    if (isDebug && token) console.log('onChangedKepValue.token:', token);
    if (isDebug && startTime) console.log('onChangedKepValue.startTime:', startTime, 'token:', token);

    // Format simple DataValue
    dataValue = formatSimpleDataValue(dataValue);
    const statusCode = dataValue.statusCode.name;
    let value = dataValue.value.value;
    if (ownerGroupName === browseName) {
      value = JSON.parse(value);
    }

    // Return else value is empty or (statusCode !== 'Good')
    // if (statusCode !== 'Good' || !value) return;
    if (isDebug && value) inspector('onChangedKepValue.value:', value);

    // Add subscribe to queue
    queueOfSubscribe.push({
      token,
      browseName,
      params,
      dataValue
    });

    if (isDebug && queueOfSubscribe.length) inspector('onChangedKepValue.queueOfSubscribe:', queueOfSubscribe.map(s => s.token));

    // WaitTimeout
    do {
      result = checkTokenQueueOfSubscribe(queueOfSubscribe, token, false);
      if (result) await pause(1000, false);
    } while (result);

    // Get current subscribe
    const subscribe = loHead(queueOfSubscribe);
    params = subscribe.params;
    dataValue = subscribe.dataValue;

    // Run subscribe funcs 
    const subscribeFuncs = subscribeParams.subscribeFuncs;
    for (let index = 0; index < subscribeFuncs.length; index++) {
      const subscribeFuncName = subscribeFuncs[index];
      const libSubscribeFunc = libs[subscribeFuncName];
      if (isFunction(libSubscribeFunc)) {
        const result = libSubscribeFunc(params, dataValue);
        resultSubscribeFuncs.push(result);
        if (true && subscribeFuncName) logger.info(`onChangedKepValue.runSubscribeFunc: "${subscribeFuncName}"`);
      }
    }

    // Show info
    Promise.all(resultSubscribeFuncs).then(results => {
      if (isDebug && results.length) inspector('saveOpcuaGroupValueToDB.result:', results[0]);
      if (isDebug && results.length) inspector('saveOpcuaGroupValueToMsSqlDB.result:', results[1]);

      // Show info  
      // showInfoForHandler(params, dataValue);
      libs.showInfoForGroupHandler(params, dataValue);
      // endTime and timeDuration
      const endTime = moment.utc().format();
      const timeDuration = getTimeDuration(startTime, endTime);
      if (isDebug && endTime) console.log('onChangedKepValue.endTime:', endTime, 'token:', token);
      if (isDebug && timeDuration) console.log('onChangedKepValue.timeDuration:', chalk.cyan(`${timeDuration}(ms)`), 'token:', chalk.cyan(token));

      // Drop element from the beginning of array
      queueOfSubscribe = loDrop(queueOfSubscribe);
    });
  } catch (error) {
    // Drop element from the beginning of array
    queueOfSubscribe = loDrop(queueOfSubscribe);
    logger.error('onChangedKepValue.Error:', error.message);
  }
}

module.exports = onChangedKepValue;
