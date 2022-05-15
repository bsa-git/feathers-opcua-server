/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const ch_m5CreateAcmYearTemplate = require('./commands/ch_m5CreateAcmYearTemplate');

const debug = require('debug')('app:runCommand');
const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function runCommand(params, dataValue) {
  let points, result, results = [];
  //--------------------------------
  if (isDebug && params) inspector('runCommand.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('runCommand.dataValue:', dataValue);

  let value = dataValue.value.value;
  value = JSON.parse(value);
  if (isDebug && value) inspector('runCommand.value:', value);

  // Run commands
  switch (value.command) {
  case 'ch_m5CreateAcmYearTemplate':
    points = value.opt.points;
    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      value.opt.point = point;
      result = await ch_m5CreateAcmYearTemplate(params, value);
      results.push(result);
    }
    break;
  default:
    break;
  }
  return results;
}

module.exports = runCommand;
