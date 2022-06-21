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

const {
  callbackSessionCallMethod,
  opcuaClientSessionAsync
} = require('../../../opcua-client-scripts/lib');

const methodAcmYearReportUpdate = require('../../../opcua-methods/methodAcmYearReportUpdate');

const {
  formatDataValue,
  whereMethodsAreExecuted,
  getOpcuaConfig
} = require('../../../opcua-helper');

const loOmit = require('lodash/omit');

let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

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
  inputArgument = { dataType: DataType.String, value: inputArgument };

  inputArgument2 = dataValue.value.value;
  inputArgument2 = { dataType: DataType.String, value: inputArgument2 };

  // Run method from client
  if (whereMethodsAreExecuted(params.id) === 'client') {
    inputArguments.push([inputArgument, inputArgument2]);
    result = await methodAcmYearReportUpdate(inputArguments);
    if (result.statusCode === 'Good') {
      if (true && result) console.log(chalk.green('Update asm year report - OK!'), 'reportDate:', chalk.cyan(result.reportDate), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    } else {
      inspector('subscription.ch_m5UpdateAcmYearReport.inputArguments:', inputArguments);
      inspector('subscription.ch_m5UpdateAcmYearReport.result:', result);
      console.log(chalk.redBright('Update asm year report - ERROR!'));
    }

    return result;
  }

  // Run method from server
  if (whereMethodsAreExecuted(params.id) === 'server') {
    inputArguments.push([inputArgument, inputArgument2]);
    // Set opcua properties
    const client = params.myOpcuaClient;
    browseName = 'CH_M5::YearReportUpdate';
    result = await client.sessionCallMethod(browseName, inputArguments);
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

    return result;
  }

  // Run method from async server
  if (whereMethodsAreExecuted(params.id) === 'asyncServer') {
    inputArguments.push(inputArgument);
    inputArguments.push(inputArgument2);
    // Get endpointUrl 
    const opcuaConfig = getOpcuaConfig(params.id);
    const endpointUrl = opcuaConfig.endpointUrl;

    // Set opcua properties
    const opcua = {};
    opcua.ownerNodeId = 'ns=1;i=1663';
    opcua.nodeId = 'ns=1;s=CH_M5::YearReportUpdate';
    opcua.inputArguments = inputArguments;

    result = await opcuaClientSessionAsync(endpointUrl, { opcua }, callbackSessionCallMethod);
    if (isDebug && result) inspector('ch_m5UpdateAcmYearReport.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, reportDate }
      if (true && result) console.log(chalk.green('Update asm year report - OK!'), 'reportDate:', chalk.cyan(outputArguments.reportDate), 'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)));
    } else {
      console.log(chalk.green('ch_m5UpdateAcmYearReport:'), chalk.cyan(statusCode));
    }

    return result;
  }
}

module.exports = ch_m5UpdateAcmYearReport;
