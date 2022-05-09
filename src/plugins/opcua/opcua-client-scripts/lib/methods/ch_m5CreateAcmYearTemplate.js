/* eslint-disable no-unused-vars */
const chalk = require('chalk');

const {
  DataType,
} = require('node-opcua');

const {
  inspector,
  getPathBasename
} = require('../../../../lib');

const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
function ch_m5CreateAcmYearTemplate(options, result) {
  let resultOptions, inputArgument = {}, inputArguments = [];
  let statusCode, outputArguments;
  //----------------------------------

  if (options) {
    if (isDebug && options) inspector('ch_m5CreateAcmYearTemplate.options:', options);

    resultOptions = Object.assign({}, options, { opcua: {} });

    resultOptions.opcua.ownerNodeId = 'ns=1;i=1663';
    resultOptions.opcua.nodeId = 'ns=1;s=CH_M5::YearTemplateCreate';

    const opt = resultOptions.opt;

    // Set input argument
    if (opt.test) inputArgument.isTest = opt.test;
    if (opt.point) inputArgument.pointID = opt.point;
    if (opt.period) inputArgument.period = opt.period;
    if (opt.year) inputArgument.startYear = opt.year;

    inputArguments.push([{
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    }]);

    resultOptions.opcua.inputArguments = inputArguments;
    return resultOptions;
  }

  if (result) {
    if (isDebug && result) inspector('ch_m5CreateAcmYearTemplate.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, hours, days }
      console.log(chalk.green('callMethod.ch_m5CreateAcmYearTemplate:'), chalk.cyan(statusCode), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
    } else {
      console.log(chalk.green('callMethod.ch_m5CreateAcmYearTemplate:'), chalk.cyan(statusCode));
    }
  }
}

module.exports = ch_m5CreateAcmYearTemplate;
