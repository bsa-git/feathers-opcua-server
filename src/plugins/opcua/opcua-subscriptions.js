/* eslint-disable no-unused-vars */
const { 
  inspector, 
} = require('../lib');

const { 
  getValueFromNodeId,
} = require('./opcua-helper');

const chalk = require('chalk');

const debug = require('debug')('app:opcua-subscriptions');
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
  if (isLog) inspector('subscriptions.onChangedCommonHandle.params:', params);
  if (isLog) inspector('subscriptions.onChangedCommonHandle.dataValue:', dataValue);
  const browseName = getValueFromNodeId(params.nodeId);
  const value = dataValue.value.value;
  console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(value));
}

module.exports = {
  onChangedCommonHandler,
};
