/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const { 
  inspector, 
} = require('../../lib');

const { 
  getValueFromNodeId,
  formatDataValue 
} = require('../opcua-helper');

const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-subscriptions/onChangedGroupHandler');
const isDebug = false;

/**
 * @method onChangedGroupHandler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedGroupHandler(params, dataValue) {
  if (isDebug) inspector('subscriptions.onChangedGroupHandler.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && dataValue) inspector('subscriptions.onChangedGroupHandler.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  let value = dataValue.value.value;
  if (isDebug) inspector('subscriptions.onChangedGroupHandler.formatDataValue:', dataValue);
  // value = (addressSpaceOption.dataType === 'Double')? loRound(value, 3) : value;
  let engineeringUnits = (dataValue.valueParams && dataValue.valueParams.engineeringUnits)? dataValue.valueParams.engineeringUnits : '';
  const timestamp = dataValue.serverTimestamp;
  engineeringUnits = engineeringUnits? `(${engineeringUnits})` : '';

  if(addressSpaceOption.group){
    value = JSON.parse(value);
    const valueKeys = Object.keys(value).length;
    console.log('<=', 
      chalk.magentaBright(`ID="${params.id}"; `), 
      chalk.greenBright(`Name="${browseName}"; `), 
      chalk.whiteBright(`Values=(${valueKeys});`), 
      chalk.cyanBright(`TM=${timestamp}`), 
      '=>');
  }
}

module.exports = onChangedGroupHandler;
