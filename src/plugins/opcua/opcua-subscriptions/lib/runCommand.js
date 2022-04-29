/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  DataType,
  VariantArrayType
} = require('node-opcua');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  checkRunCommand
} = require('../../opcua-client-scripts/lib');

const sessionCallMethod = require('./sessionCallMethod');

const debug = require('debug')('app:runCommand');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function runCommand(params, dataValue) {
  let result, inputArgument = {}, inputArguments = [];
  //----------------------------------

  if (isDebug && params) inspector('runCommand.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('runCommand.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('runCommand.formatDataValue:', dataValue);

  let options = dataValue.value.value;
  options = JSON.parse(options);
  // if (!checkRunCommand(options)) {
  //   // Command error
  //   inspector('runCommand_ERROR.options:', options);
  //   throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  // }
  // const checkResult = checkRunCommand(options);

  // Run commands
  const opt = options.opt;
  switch (options.command) {
  case 'ch-m5CreateAcmYearTemplate':
    if (isDebug && options) inspector('runCommand.options:', options);
    // Set input argument
    if(opt.test) inputArgument.isTest = opt.test;
    if(opt.point) inputArgument.pointID = opt.point;
    if(opt.period) inputArgument.period = opt.period;
      
    inputArguments.push([
      {
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      }
    ]);

    params.inputArguments = inputArguments;
    params.browseName = opt.browseName;

    result = await sessionCallMethod(params);
    if(isDebug && result) inspector('subscriptions.runCommand.result:', result); 
    console.log(chalk.green('runCommand.ch-m5CreateAcmYearTemplate:'), chalk.cyan(result[0].statusCode.name));
    break;

  default:
    break;
  }

}

module.exports = runCommand;
