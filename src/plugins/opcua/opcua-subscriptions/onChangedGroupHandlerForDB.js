/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  isSaveOpcuaToDB,
  saveOpcuaGroupValue
} = require('../../db-helpers');

const {
  getValueFromNodeId,
  formatDataValue
} = require('../opcua-helper');

const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-subscriptions/onChangedGroupHandlerForDB');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedGroupHandlerForDB
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForDB(params, dataValue) {
  if (isLog && params) inspector('subscriptions.onChangedGroupHandlerForDB.params:', params);
  if (isLog && dataValue) inspector('subscriptions.onChangedGroupHandlerForDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (!addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  if (isDebug && dataValue) inspector('subscriptions.onChangedGroupHandlerForDB.formatDataValue:', dataValue);
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  let value = dataValue.value.value;
  // value = (addressSpaceOption.dataType === 'Double') ? loRound(value, 3) : value;
  let engineeringUnits = (dataValue.valueParams && dataValue.valueParams.engineeringUnits) ? dataValue.valueParams.engineeringUnits : '';
  const timestamp = dataValue.serverTimestamp;
  engineeringUnits = engineeringUnits ? `(${engineeringUnits})` : '';

  // Save data to DB
  if (isSaveOpcuaToDB()) {
    const savedValue = await saveOpcuaGroupValue(params.app, browseName, value);
    if (isLog && savedValue) inspector('onChangedGroupHandlerForDB.savedValue:', savedValue);
    // inspector('onChangedGroupHandlerForDB.savedValue:', savedValue);
  }

  value = JSON.parse(value);
  const valueKeys = Object.keys(value).length;
  console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.whiteBright(`Number of values=(${valueKeys});`), chalk.cyanBright(`Timestamp=${timestamp}`), '===>>');
}

module.exports = onChangedGroupHandlerForDB;
