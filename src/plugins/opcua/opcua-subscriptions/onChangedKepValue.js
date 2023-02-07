/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const loOmit = require('lodash/omit');

const {
  inspector,
  logger,
  isFunction,
  Queue
} = require('../../lib');

const libs = require('./lib');

const {
  formatSimpleDataValue
} = require('../opcua-helper');

const isDebug = false;

/**
 * @method onChangedKepValue
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedKepValue(params, dataValue) {
  let ownerGroupVariable, resultSubscribeFuncs = [], queue = null;
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

    // Format simple DataValue
    dataValue = formatSimpleDataValue(dataValue);
    const statusCode = dataValue.statusCode.name;
    let value = dataValue.value.value;
    if (ownerGroupName === browseName) {
      value = JSON.parse(value);
    }

    if (isDebug && value) inspector('onChangedKepValue.value:', value);

    // Create queue
    queue = new Queue(browseName, 'mssql-list');
    await queue.doWhile();

    // Run subscribe funcs 
    const subscribeFuncs = subscribeParams.subscribeFuncs;
    for (let index = 0; index < subscribeFuncs.length; index++) {
      const subscribeFuncName = subscribeFuncs[index];
      const libSubscribeFunc = libs[subscribeFuncName];
      if (isFunction(libSubscribeFunc)) {
        const result = libSubscribeFunc(params, dataValue);
        resultSubscribeFuncs.push(result);
        if (isDebug && subscribeFuncName) logger.info(`onChangedKepValue.runSubscribeFunc: "${subscribeFuncName}"`);
      }
    }

    // Show info
    Promise.all(resultSubscribeFuncs).then(results => {
      if (isDebug && results.length) inspector('saveOpcuaGroupValueToDB.result:', results[0]);
      if (isDebug && results.length) inspector('saveOpcuaGroupValueToMsSqlDB.result:', results[1]);

      // Show info  
      libs.showInfoForGroupHandler(params, dataValue);

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

module.exports = onChangedKepValue;
