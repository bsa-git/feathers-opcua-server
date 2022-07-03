/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');

const loOmit = require('lodash/omit');
const loTemplate = require('lodash/template');

const {
  DataType,
} = require('node-opcua');

const {
  appRoot,
  inspector,
  logger,
  getPathBasename,
  readJsonFileSync,
  removeFilesFromDirSync,
  doesFileExist
} = require('../../../../lib');

const {
  saveStoreOpcuaGroupValue
} = require('../../../../db-helpers');

let paramsPath = '/src/api/app/opcua-methods/acm-reports/params';

const {
  acmYearTemplateFileName,
} = require(join(...[appRoot, paramsPath]));

const debug = require('debug')('app:command.ch_m5SyncAcmYearReport');
const isDebug = false;

/**
 * @method ch_m5SyncAcmYearReport
 * 
 * @param {Object} params 
 * @param {Object} value
 * @returns {void}
 */
async function ch_m5SyncAcmYearReport(params, value) {
  let result, inputArgument = {}, inputArguments = [];
  let statusCode, outputArguments, savedValuesCount = 0;
  let dataItems;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5SyncAcmYearReport.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('ch_m5SyncAcmYearReport.value:', value);

  // Get my opcua client
  const client = params.myOpcuaClient;

  const opt = value.opt;
  const opcua = value.opcua;

  // Set input argument
  if (opt.point) inputArgument.pointID = opt.point;
  if (opt.pattern) inputArgument.pattern = opt.pattern;

  inputArguments.push([
    {
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    }
  ]);

  // Get base params file
  const baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: 1 });
  const paramFullsPath = [appRoot, paramsPath, baseParamsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`Run script - ERROR. File with name "${chalk.cyan(baseParamsFile)}" not found.`);
    throw new Error(`Run script - ERROR. File with name "${baseParamsFile}" not found.`);
  }
  const baseParams = require(join(...paramFullsPath));

  if (baseParams.syncYearReportFromStore) {
    console.log(
      chalk.green('runCommand.ch_m5SyncAcmYearReport: OK!'), 
      `For pointID=${inputArgument.pointID} syncStoreCount:`, chalk.cyan(10)
    );
  } else {
    // Run server method
    const browseName = 'CH_M5::AcmDayReportsDataGet';
    result = await client.sessionCallMethod(browseName, inputArguments);
    if (isDebug && result) inspector('ch_m5SyncAcmYearReport.sessionCallMethod.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params }
      console.log(
        chalk.green('runMetod.methodAcmDayReportsDataGet: OK!'),
        'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath))
      );
      // Get params
      const pointID = outputArguments.params.pointID;
      const groupBrowseName = outputArguments.params.acmTagBrowseName;
      const syncResultOutputPath = outputArguments.params.outputPath;
      // Get data items
      let outputFile = outputArguments.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];
    } else {
      console.log(chalk.green('runCommand.ch_m5SyncAcmYearReport:'), chalk.cyan(statusCode));
    }
  }
}

module.exports = ch_m5SyncAcmYearReport;
