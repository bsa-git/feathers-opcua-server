/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  DataType,
  VariantArrayType
} = require('node-opcua');

const {
  inspector,
  getPathBasename
} = require('../../../../lib');


const sessionCallMethod = require('../sessionCallMethod');
const e = require('cors');

const debug = require('debug')('app:ch_m5CreateAcmYearTemplate');
const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function ch_m5CreateAcmYearTemplate(params, value) {
  let result, inputArgument = {}, inputArguments = [];
  let statusCode, outputArguments;
  //----------------------------------

  if (isDebug && params) inspector('ch_m5CreateAcmYearTemplate.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('ch_m5CreateAcmYearTemplate.value:', value);

  const opt = value.opt;
  const opcua = value.opcua;

  // Set input argument
  if (opt.test) inputArgument.isTest = opt.test;
  if (opt.point) inputArgument.pointID = opt.point;
  if (opt.period) inputArgument.period = opt.period;
  if (opt.year) inputArgument.startYear = opt.year;

  inputArguments.push([
    {
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    }
  ]);

  params.opcua = {};
  params.opcua.inputArguments = inputArguments;
  params.opcua.browseName = opcua.browseName;

  result = await sessionCallMethod(params);
  if (isDebug && result) inspector('ch_m5CreateAcmYearTemplate.result:', result);

  statusCode = result[0].statusCode.name;
  outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, hours, days }

  if(statusCode === 'Good') {
    console.log(chalk.green('runCommand.ch_m5CreateAcmYearTemplate:'), chalk.cyan(statusCode), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
  } else {
    console.log(chalk.green('runCommand.ch_m5CreateAcmYearTemplate:'), chalk.cyan(statusCode));
  }
  
}

module.exports = ch_m5CreateAcmYearTemplate;
