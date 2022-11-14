/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRound = require('lodash/round');

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
 * @method showInfoForHandler2
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function showInfoForHandler2(params, dataValue) {
  let valueKeys = 0, command = '';
  //---------------------
  if (isDebug && params) inspector('showInfoForHandler.params:', loOmit(params, ['app']));
  if (isDebug && dataValue) inspector('showInfoForHandler.dataValue:', dataValue);

  const browseName = getValueFromNodeId(params.addressSpaceOption);
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
    value = loRound(value, 3);
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
      chalk.whiteBright(`${valueKeys? 'Values=(' + valueKeys + ')' : 'Value = ' + loRound(value, 3)};`),
      chalk.cyanBright(`TM=${timestamp}`),
      '=>');
  }
}

module.exports = showInfoForHandler2;
