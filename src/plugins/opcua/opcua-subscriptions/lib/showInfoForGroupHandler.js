/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
  isShowLog4Prod
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const chalk = require('chalk');
const moment = require('moment');

const debug = require('debug')('app:showInfoForGroupHandler');
const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function showInfoForGroupHandler(params, dataValue) {
  let storeTime = '', logMessage = '';
  //------------------------
  // Without logging
  if(!isShowLog4Prod()) return;
  
  if (isDebug && params) inspector('showInfoForGroupHandler.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && dataValue) inspector('showInfoForGroupHandler.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  const isStore = !!addressSpaceOption.store;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('onChangedGroupHandlerForASM.formatDataValue:', dataValue);
  const timestamp = moment(dataValue.serverTimestamp).format('YYYY-MM-DD HH:mm:ss');
  
  let value = dataValue.value.value;
  value = JSON.parse(value);
  let valueKeys = Object.keys(value).length;
  if(isStore && value['!value'] && value['!value']['dateTime']){
    storeTime = value['!value']['dateTime'];
  } 
  if(Object.keys(value).includes('!value')){
    valueKeys = valueKeys - 1;  
  }
  if(isStore){
    console.log('<=', 
      chalk.magentaBright(`ID="${params.id}"; `), 
      chalk.greenBright(`Name="${browseName}"; `), 
      chalk.whiteBright(`StoreTime=('${storeTime}');`), 
      chalk.whiteBright(`Values=(${valueKeys});`), 
      chalk.cyanBright(`TM=${timestamp}`), 
      '=>');
  }else{
    console.log('<=', 
      chalk.magentaBright(`ID="${params.id}"; `), 
      chalk.greenBright(`Name="${browseName}"; `), 
      chalk.whiteBright(`Values=(${valueKeys});`), 
      chalk.cyanBright(`TM=${timestamp}`), 
      '=>');
  }
}

module.exports = showInfoForGroupHandler;
