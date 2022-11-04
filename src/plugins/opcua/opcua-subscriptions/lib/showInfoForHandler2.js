/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue,
  getValueFromNodeId
} = require('../../opcua-helper');

const chalk = require('chalk');
const moment = require('moment');

const debug = require('debug')('app:showInfoForHandler');
const isDebug = false;

/**
 * @method showInfoForHandler
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function showInfoForHandler(params, dataValue) {
  let valueKeys = 0, command = '';
  //---------------------
  if (isDebug && params) inspector('showInfoForHandler.params:', loOmit(params, ['app']));
  if (isDebug && dataValue) inspector('showInfoForHandler.dataValue:', dataValue);

  const browseName = getValueFromNodeId(params.addressSpaceOption);
  // dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('showInfoForHandler.dataValue:', dataValue);
  const timestamp = moment(dataValue.serverTimestamp).format('YYYY-MM-DD HH:mm:ss');

  let value = dataValue.value.value;
  try {
    value = JSON.parse(value);
    valueKeys = Object.keys(value).length;
    if (Object.keys(value).includes('!value')) {
      valueKeys = valueKeys - 1;
    }
    if (Object.keys(value).includes('command')) {
      command = value['command'];
    }
  } catch (error) {
    value = dataValue.value.value;
  }

  if (command) {
    console.log('<=',
      chalk.greenBright(`Name="${browseName}"; `),
      chalk.whiteBright(`Command=('${command}');`),
      chalk.cyanBright(`TM=${timestamp}`),
      '=>');
  } else {
    console.log('<=',
      chalk.greenBright(`Name="${browseName}"; `),
      chalk.whiteBright(`Values=(${valueKeys ? valueKeys : value});`),
      chalk.cyanBright(`TM=${timestamp}`),
      '=>');
  }
}

module.exports = showInfoForHandler;
