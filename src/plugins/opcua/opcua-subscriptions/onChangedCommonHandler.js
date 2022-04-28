/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const { 
  inspector, 
} = require('../../lib');

const { 
  getValueFromNodeId,
  getLastNameFromNodeId
} = require('../opcua-helper');

const chalk = require('chalk');

const debug = require('debug')('app:opcua-subscriptions/onChangedCommonHandler');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedCommonHandler(params, dataValue) {
  if (isLog) inspector('subscriptions.onChangedCommonHandle.params:', loOmit(params, ['myOpcuaClient']));
  if (isLog) inspector('subscriptions.onChangedCommonHandle.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  const value = dataValue.value.value;
  if(isDebug && browseName && value) console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(value));
}

module.exports = onChangedCommonHandler;
