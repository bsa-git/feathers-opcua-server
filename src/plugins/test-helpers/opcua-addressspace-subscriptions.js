/* eslint-disable no-unused-vars */
const { inspector, getValueFromNodeId } = require('../../plugins');
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
  if (isLog) inspector('subscriptions.onChangedCommonHandle.params.nodeId:', params.nodeId);
  const browseName = getValueFromNodeId(params.nodeId);
  const value = loRound(dataValue.value.value, 3);
  console.log(chalk.green(`subscription::${browseName}:`), chalk.cyan(value));
}

module.exports = {
  onChangedCommonHandler,
};
