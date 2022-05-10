/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');

const {
  DataType,
} = require('node-opcua');

const {
  appRoot,
  inspector,
  getPathBasename
} = require('../../../../lib');

const sessionCallMethod = require('../sessionCallMethod');
const methodAcmYearReportUpdate = require('../../../opcua-methods/methodAcmYearReportUpdate');

const {
  formatDataValue,
  whereMethodsAreExecuted
} = require('../../../opcua-helper');

const loOmit = require('lodash/omit');

let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

const {
  paramsFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

/**
 * @method ch_m5UpdateAcmYearReport
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function ch_m5UpdateAcmYearReport(params, dataValue) {
  let result, inputArgument, inputArgument2, inputArguments = [];
  let statusCode, outputArguments;
  //-----------------------------------

  if (isDebug && params) inspector('ch_m5UpdateAcmYearReport.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('ch_m5UpdateAcmYearReport.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Get group value
  let browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('ch_m5UpdateAcmYearReport.formatDataValue:', dataValue);

  inputArgument = JSON.stringify(loOmit(params, ['myOpcuaClient', 'app']));
  inputArgument2 = dataValue.value.value;

  inputArguments.push([
    {
      dataType: DataType.String,
      value: inputArgument,
    },
    {
      dataType: DataType.String,
      value: inputArgument2,
    }
  ]);

  if (whereMethodsAreExecuted(params.id) === 'client') {
    result = await methodAcmYearReportUpdate(inputArguments);
    if (result.statusCode === 'Good') {
      if (true && result) console.log(chalk.green('Update asm year report - OK!'), 'reportDate:', chalk.cyan(result.reportDate), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    } else {
      inspector('subscription.ch_m5UpdateAcmYearReport.inputArguments:', inputArguments);
      inspector('subscription.ch_m5UpdateAcmYearReport.result:', result);
      console.log(chalk.redBright('Update asm year report - ERROR!'));
    }
  }

  if (whereMethodsAreExecuted(params.id) === 'server') {

    // Set opcua properties
    const client = params.myOpcuaClient;
    browseName = 'CH_M5::YearReportUpdate';
    const result = await client.sessionCallMethod(browseName, inputArguments);
    if (isDebug && result) inspector('ch_m5UpdateAcmYearReport.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, reportDate }
      if (true && result) console.log(chalk.green('Update asm year report - OK!'), 'reportDate:', chalk.cyan(outputArguments.reportDate), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
    } else {
      inspector('subscription.ch_m5UpdateAcmYearReport.browseName:', browseName);
      inspector('subscription.ch_m5UpdateAcmYearReport.inputArguments:', inputArguments);
      inspector('subscription.ch_m5UpdateAcmYearReport.result:', result);
      console.log(chalk.redBright('Update asm year report - ERROR!'), 'statusCode: ', chalk.cyan(statusCode));
    }
  }

  if (whereMethodsAreExecuted(params.id) === 'asyncServer') {
    // Set opcua properties
    params.opcua = {};
    params.opcua.browseName = 'ns=1;s=CH_M5::YearReportUpdate';
    params.opcua.inputArguments = inputArguments;
    // Run session call method
    result = await sessionCallMethod(params);
    if (isDebug && result) inspector('ch_m5UpdateAcmYearReport.result:', result);

    statusCode = result[0].statusCode.name;
    if (result[0].outputArguments.length) {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, reportDate }
    }

    if (statusCode === 'Good') {
      if (isDebug && result) console.log(chalk.green('Update asm year report - OK!'), 'reportDate:', chalk.cyan(outputArguments.reportDate), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
    } else {
      console.log(chalk.green('ch_m5UpdateAcmYearReport:'), chalk.cyan(statusCode));
    }
  }
}

module.exports = ch_m5UpdateAcmYearReport;
