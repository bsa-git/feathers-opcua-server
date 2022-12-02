/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');

const {
  DataType,
} = require('node-opcua');

const {
  appRoot,
  logger,
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

  if (isDebug && params) inspector('ch_m5UpdateAcmYearReport.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && dataValue) inspector('ch_m5UpdateAcmYearReport.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const pointID = addressSpaceOption.getterParams.pointID;

  // Get group value
  let browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('ch_m5UpdateAcmYearReport.formatDataValue:', dataValue);

  inputArgument = { pointID };
  inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };

  inputArgument2 = dataValue.value ? dataValue.value.value : dataValue;
  inputArgument2 = { dataType: DataType.String, value: inputArgument2 };

  // Run method from client
  if (whereMethodsAreExecuted(params.id) === 'client') {
    inputArguments.push([inputArgument, inputArgument2]);
    result = await methodAcmYearReportUpdate(inputArguments);
    if (isDebug && result) inspector('ch_m5UpdateAcmYearReport.result:', result);
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
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// [{ statusCode, resultPath, params, reportYear, reportDates }, ...]
      if (isDebug && result) console.log(
        chalk.green('sessionCallMethod(methodAcmYearReportUpdate): OK!'),
        `pointID: ${chalk.cyan(pointID)}`
      );
    } else {
      logger.error(
        `Update asm year report - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        browseName:'${chalk.cyan(browseName)}'`
      );
      inspector('subscription.ch_m5UpdateAcmYearReport.ERROR.inputArguments:', inputArguments);
      inspector('subscription.ch_m5UpdateAcmYearReport.ERROR.result:', result);
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
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// [{ statusCode, resultPath, params, reportYear, reportDates }, ...]
      if (isDebug && result) console.log(
        chalk.green('RunMetod(methodAcmYearReportUpdate): OK!'),
        `pointID: ${chalk.cyan(pointID)}`
      );
    } else {
      logger.error(
        `Update asm year report - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        browseName:'${chalk.cyan(browseName)}'`
      );
      inspector('subscription.ch_m5UpdateAcmYearReport.ERROR.inputArguments:', inputArguments);
      inspector('subscription.ch_m5UpdateAcmYearReport.ERROR.result:', result);
    }

    return result;
  }
}

module.exports = ch_m5UpdateAcmYearReport;
