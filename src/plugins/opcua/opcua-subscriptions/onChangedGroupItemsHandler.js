/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const { 
  inspector, 
} = require('../../lib');

const { 
  formatDataValue 
} = require('../opcua-helper');

const chalk = require('chalk');

const debug = require('debug')('app:opcua-subscriptions/onChangedGroupHandler');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedGroupItemsHandler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedGroupItemsHandler(params, dataValue) {
  if (isLog) inspector('subscriptions.onChangedGroupItemsHandler.params:', loOmit(params, ['myOpcuaClient']));
  if (isLog) inspector('subscriptions.onChangedGroupItemsHandler.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  let value = dataValue.value.value;
  if (isLog) inspector('subscriptions.onChangedGroupItemsHandler.formatDataValue:', dataValue);
  // value = (addressSpaceOption.dataType === 'Double')? loRound(value, 3) : value;
  let engineeringUnits = (dataValue.valueParams && dataValue.valueParams.engineeringUnits)? dataValue.valueParams.engineeringUnits : '';
  const timestamp = dataValue.serverTimestamp;
  engineeringUnits = engineeringUnits? `(${engineeringUnits})` : '';

  if(addressSpaceOption.group){
    value = JSON.parse(value);
    const valueKeys = Object.keys(value).length;
    console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.whiteBright(`Number of values=(${valueKeys});`), chalk.cyanBright(`Timestamp=${timestamp}`), '===>>');
  }

  if(addressSpaceOption.ownerGroup){
    console.log(chalk.green(`${browseName} =`), chalk.cyan(`${value} ${engineeringUnits};`), chalk.green('aliasName ='), `"${addressSpaceOption.aliasName}"`);
  }
 
}

module.exports = onChangedGroupItemsHandler;
