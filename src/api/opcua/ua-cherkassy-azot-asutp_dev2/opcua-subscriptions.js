/* eslint-disable no-unused-vars */
const { 
  inspector, 
  getValueFromNodeId,
  formatDataValue 
} = require('../../../plugins');
const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-addressspace-subscriptions');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCH_M5Handler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedCH_M5Handler(params, dataValue) {
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.params:', params);
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  const browseName = getValueFromNodeId(params.nodeId);
  const addressSpaceOption = params.addressSpaceOption;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  let value = dataValue.value.value;
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.formatDataValue:', dataValue);
  value = (addressSpaceOption.dataType === 'Double')? loRound(value, 3) : value;
  let engineeringUnits = (dataValue.valueParams && dataValue.valueParams.engineeringUnits)? dataValue.valueParams.engineeringUnits : '';
  const timestamp = dataValue.serverTimestamp;
  engineeringUnits = engineeringUnits? `(${engineeringUnits})` : '';
    
  // if(addressSpaceOption.ownerGroup === 'CH_M51::ValueFromFile'){
  //   console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(`${value} ${engineeringUnits} Timestamp=${timestamp}`));
  // }

  if(addressSpaceOption.group){
    value = JSON.parse(value);
    const valueKeys = Object.keys(value).length;
    console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.cyanBright(`Number of values=(${valueKeys}); Timestamp=${timestamp}`), '===>>');
    // console.log(chalk.green(`subscriptionValue.${browseName}:`), chalk.cyan(`${value} ${engineeringUnits} Timestamp=${timestamp}`));
  }
}

module.exports = {
  onChangedCH_M5Handler
};
