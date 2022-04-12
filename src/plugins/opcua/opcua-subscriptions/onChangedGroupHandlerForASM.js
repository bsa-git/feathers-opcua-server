/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  formatDataValue
} = require('../opcua-helper');

const {
  isSaveOpcuaToDB,
  saveOpcuaGroupValue
} = require('../../db-helpers');

const chalk = require('chalk');

const debug = require('debug')('app:onChangedGroupHandlerForASM');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {
  if (isLog && params) inspector('onChangedGroupHandlerForASM.params:', params);
  if (isLog && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  const timestamp = dataValue.serverTimestamp;

  // Save data to DB
  if (isSaveOpcuaToDB()) {
    const savedValue = await saveOpcuaGroupValue(params.app, browseName, value);
    if (isLog && savedValue) inspector('onChangedGroupHandlerForASM.savedValue:', savedValue);
  }

  value = JSON.parse(value);
  const valueKeys = Object.keys(value).length;
  console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.whiteBright(`Number of values=(${valueKeys});`), chalk.cyanBright(`Timestamp=${timestamp}`), '===>>');

}

module.exports = onChangedGroupHandlerForASM;
