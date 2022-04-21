/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const chalk = require('chalk');
const moment = require('moment');

const debug = require('debug')('app:showInfoForGroupHandler');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function showInfoForGroupHandler(params, dataValue) {
  if (isLog && params) inspector('showInfoForGroupHandler.params:', params);
  if (isLog && dataValue) inspector('showInfoForGroupHandler.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.formatDataValue:', dataValue);
  const timestamp = moment(dataValue.serverTimestamp).format('YYYY-MM-DD HH:mm:ss');
  
  let value = dataValue.value.value;
  value = JSON.parse(value);
  let valueKeys = Object.keys(value).length;
  if(Object.keys(value).includes('!value')){
    valueKeys = valueKeys - 1;  
  }
  console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.whiteBright(`Number of values=(${valueKeys});`), chalk.cyanBright(`tm=${timestamp}`), '===>>');
}

module.exports = showInfoForGroupHandler;
