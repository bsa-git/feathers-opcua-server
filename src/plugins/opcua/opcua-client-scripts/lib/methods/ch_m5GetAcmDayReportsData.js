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
 * @method ch_m5GetAcmDayReportsData
 * 
 * @param {Object} options 
 * @param {Object} result
 * @returns {Object|String}
 */
function ch_m5GetAcmDayReportsData(options, result) {
  let resultOptions, inputArgument = {}, inputArguments = [];
  let statusCode, outputArguments;
  //----------------------------------
  if (result) {
    if (isDebug && result) inspector('ch_m5GetAcmDayReportsData.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params }
      console.log(chalk.green('callMethod.ch_m5GetAcmDayReportsData:'), chalk.cyan(statusCode), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
    } else {
      inspector('allMethod.ch_m5GetAcmDayReportsData.options:', options);
      inspector('allMethod.ch_m5GetAcmDayReportsData.result:', result);
      console.log(chalk.green('callMethod.ch_m5GetAcmDayReportsData.statusCode:'), chalk.cyan(statusCode));
    }
    return statusCode;
  } else {
    if (isDebug && options) inspector('ch_m5GetAcmDayReportsData.options:', options);

    resultOptions = Object.assign({}, options, { opcua: {} });

    resultOptions.opcua.ownerNodeId = 'ns=1;i=1663';
    resultOptions.opcua.nodeId = 'ns=1;s=CH_M5::AcmDayReportsDataGet';

    const opt = resultOptions.opt;

    // Set input argument
    if (opt.point) inputArgument.pointID = opt.point;
    if (opt.pattern) inputArgument.pattern = opt.pattern;

    inputArguments.push({
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    });

    resultOptions.opcua.inputArguments = inputArguments;
    return resultOptions;
  }
}

module.exports = ch_m5GetAcmDayReportsData;
