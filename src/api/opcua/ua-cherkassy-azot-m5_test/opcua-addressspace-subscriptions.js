/* eslint-disable no-unused-vars */
const { 
  inspector, 
  getValueFromNodeId,
  formatDataValue 
} = require('../../../plugins');
const {
  Variant,
  DataType,
  StatusCodes,
  VariantArrayType,
  standardUnits,
} = require('node-opcua');
const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-addressspace-subscriptions');
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
  inspector('subscriptions.onChangedCommonHandle.dataValue:', dataValue);
  const browseName = getValueFromNodeId(params.nodeId);
  const value = loRound(dataValue.value.value, 3);
  console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(value));
}

/**
 * @method onChangedCH_M5Handler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedCH_M5Handler(params, dataValue) {
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.params:', params);
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  // inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  const browseName = getValueFromNodeId(params.nodeId);
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.formatDataValue:', dataValue);
  const value = loRound(dataValue.value.value, 3);
  const engineeringUnits = dataValue.valueParams.engineeringUnits;
  const timestamp = dataValue.sourceTimestamp;
  console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(`${value} (${engineeringUnits}) Timestamp=${timestamp}`));
}

module.exports = {
  onChangedCommonHandler,
  onChangedCH_M5Handler
};
