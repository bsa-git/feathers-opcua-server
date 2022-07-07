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
  getOpcuaTags
} = require('../../../../opcua/opcua-helper');

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
  let metodResult, inputArgument, inputArgument2, inputArguments;
  let statusCode, outputArguments, savedValuesCount = 0, pointID;
  let metodBrowseName, dataItems, paramsFile, paramFullsPath, baseParamsFile;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5SyncAcmYearReport.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('ch_m5SyncAcmYearReport.value:', value);

  // Get my opcua client
  const client = params.myOpcuaClient;

  // Get params file
  pointID = value.opt.point;
  paramsFile = loTemplate(acmYearTemplateFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`Run script - ERROR. File with name "${chalk.cyan(paramsFile)}" not found.`);
    throw new Error(`Run script - ERROR. File with name "${paramsFile}" not found.`);
  }

  let reportParams = require(join(...paramFullsPath));
  if (reportParams.baseParams) {
    // Get base params file
    baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: reportParams.baseParams });
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    if (!doesFileExist(paramFullsPath)) {
      logger.error(`Run script - ERROR. File with name "${chalk.cyan(baseParamsFile)}" not found.`);
      throw new Error(`Run script - ERROR. File with name "${baseParamsFile}" not found.`);
    }
    const baseParams = require(join(...paramFullsPath));
    reportParams = Object.assign({}, baseParams, reportParams);
  }
  if (isDebug && reportParams) inspector('ch_m5SyncAcmYearReport.reportParams:', reportParams);


  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  const groupBrowseName = reportParams.acmTagBrowseName;
  // Get acm tag
  const groupTag = opcuaTags.find(t => t.browseName === groupBrowseName);
  if (!groupTag) {
    logger.error(`Run script - ERROR. Tag with browseName "${chalk.cyan(groupBrowseName)}" not found.`);
    throw new Error(`Run script - ERROR. Tag with browseName "${groupBrowseName}" not found.`);
  }
  if (isDebug && groupTag) inspector('ch_m5SyncAcmYearReport.groupTag:', groupTag);

  //--- Get dataItems from store or day reports ---//
  if (reportParams.syncYearReportFromStore) {
    console.log(
      chalk.green('runCommand.ch_m5SyncAcmYearReport: OK!'),
      `For pointID=${pointID} syncStoreCount:`, chalk.cyan(10)
    );
  } else {
    //--- Run server method -> 'methodAcmDayReportsDataGet' ---//

    const opt = value.opt;

    // Set input argument
    inputArgument = {};
    if (opt.point) inputArgument.pointID = opt.point;
    if (opt.pattern) inputArgument.pattern = opt.pattern;
    inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };
    inputArguments = [];
    inputArguments.push([inputArgument]);

    metodBrowseName = 'CH_M5::AcmDayReportsDataGet';
    metodResult = await client.sessionCallMethod(metodBrowseName, inputArguments);
    if (isDebug && metodResult) inspector('runMetod.methodAcmDayReportsDataGet.metodResult:', metodResult);
    statusCode = metodResult[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(metodResult[0].outputArguments[0].value);// { resultPath, params }
      // Get params
      pointID = outputArguments.params.pointID;
      const syncResultOutputPath = outputArguments.params.outputPath;
      // Get data items
      let outputFile = outputArguments.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];
      if (true && dataItems.length) console.log(
        chalk.green('runMetod.methodAcmDayReportsDataGet: OK!'),
        'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath)),
        'dataItemsCount:', chalk.cyan(dataItems.length)
      );
    } else {
      logger.error(
        `runMetod.methodAcmDayReportsDataGet - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        metodBrowseName:'${chalk.cyan(metodBrowseName)}'`
      );
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.metodResult:', metodResult);
    }
  }

  //--- Run server method -> 'methodAcmYearReportUpdate' ---//

  // Set inputArguments
  params.addressSpaceOption = groupTag;
  inputArgument = JSON.stringify(loOmit(params, ['myOpcuaClient', 'app']));
  inputArgument = { dataType: DataType.String, value: inputArgument };
  inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
  inputArguments = [];
  inputArguments.push([inputArgument, inputArgument2]);
  if (isDebug && inputArguments.length) inspector('runCommand.ch_m5SyncAcmYearReport.inputArguments:', inputArguments);

  // Run server method -> methodAcmYearReportUpdate
  metodBrowseName = 'CH_M5::YearReportUpdate';
  metodResult = await client.sessionCallMethod(metodBrowseName, inputArguments);
  if (isDebug && metodResult) inspector('runMetod.methodAcmYearReportUpdate.metodResult:', metodResult);

  statusCode = metodResult[0].statusCode.name;
  if (statusCode === 'Good') {
    outputArguments = JSON.parse(metodResult[0].outputArguments[0].value);// { resultPath, params, reportYear, reportDates }
    if (isDebug && outputArguments) inspector('runMetod.methodAcmYearReportUpdate.reportDates:', outputArguments.reportDates);
    if (true && outputArguments) console.log(
      chalk.green('runMetod.methodAcmYearReportUpdate: OK!'),
      'reportYear:', chalk.cyan(outputArguments.reportYear),
      'reportDatesCount:', chalk.cyan(outputArguments.reportDates.length),
      'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath))
    );
  } else {
    logger.error(
      `runMetod.methodAcmYearReportUpdate - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        metodBrowseName:'${chalk.cyan(metodBrowseName)}'`
    );
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.metodResult:', metodResult);
  }
  // console.log(
  //   chalk.green('runCommand.ch_m5SyncAcmYearReport: OK!'),
  //   `For pointID=${pointID} syncAcmYearReportCount:`, chalk.cyan(100)
  // );
}

module.exports = ch_m5SyncAcmYearReport;
