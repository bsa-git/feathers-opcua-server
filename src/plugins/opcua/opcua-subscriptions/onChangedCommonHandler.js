/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loRound = require('lodash/round');

const { 
  inspector, 
} = require('../../lib');

const { 
  getValueFromNodeId,
  getLastNameFromNodeId
} = require('../opcua-helper');

const chalk = require('chalk');
const moment = require('moment');

const debug = require('debug')('app:opcua-subscriptions/onChangedCommonHandler');
const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function onChangedCommonHandler(params, dataValue) {
  if (isDebug) inspector('onChangedCommonHandle.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('onChangedCommonHandle.dataValue:', dataValue);
  const statusCode = dataValue.statusCode.name;
  const value = dataValue.value.value;
  // console.log('onChangedCommonHandle.params.addressSpaceOption:', params.addressSpaceOption);
  const browseName = getValueFromNodeId(params.addressSpaceOption.nodeId);
  const timestamp = moment(dataValue.serverTimestamp).format('YYYY-MM-DD HH:mm:ss');

  if(true && browseName) console.log('<=',
    chalk.greenBright(`Name="${browseName}"; `),
    chalk.whiteBright(`StatusCode=('${statusCode}');`),
    chalk.whiteBright(`Value = ${loRound(value, 3)};`),
    chalk.cyanBright(`TM=${timestamp}`),
    '=>');
}

module.exports = onChangedCommonHandler;
