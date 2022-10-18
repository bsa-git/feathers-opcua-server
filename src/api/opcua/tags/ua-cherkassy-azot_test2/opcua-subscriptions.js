/* eslint-disable no-unused-vars */
const {
  inspector,
  isNumber,
  formatDataValue
} = require('../../../../plugins');

const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-addressspace-subscriptions');
const isDebug = false;

/**
 * @method onChangedCH_M5Handler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedCH_M5Handler(params, dataValue) {
  if (isDebug) inspector('subscriptions.onChangedCH_M5Handler.params:', params);
  if (isDebug) inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  // inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('subscriptions.onChangedCH_M5Handler.formatDataValue:', dataValue);
  // inspector('subscriptions.onChangedCH_M5Handler.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  value = isNumber(value) ? loRound(value, 3) : `[${value}]`;
  let engineeringUnits = dataValue.valueParams.engineeringUnits;
  engineeringUnits = engineeringUnits ? `(${engineeringUnits})` : '';
  const timestamp = dataValue.serverTimestamp;
  console.log(chalk.green(`subscriptionValue(${browseName}):`), chalk.cyan(`${value} ${engineeringUnits}`), 'Timestamp=', chalk.cyan(`${timestamp}`));
}

/**
 * @method onChangedRunCommandTest
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedRunCommandTest(params, dataValue) {
  if (isDebug && params) inspector('onChangedRunCommandTest.params:', params);
  if (isDebug && dataValue) inspector('onChangedRunCommandTest.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('onChangedRunCommandTest.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  
  const timestamp = dataValue.serverTimestamp;
  console.log(chalk.green(`subscriptionValue(${browseName}):`), chalk.cyan(`'${value}'`), 'Timestamp=', chalk.cyan(`${timestamp}`));
}

module.exports = {
  onChangedCH_M5Handler,
  onChangedRunCommandTest,
};
