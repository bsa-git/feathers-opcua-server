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
  let result, inputArgument = {}, inputArgument2 = {}, inputArguments = [];
  let statusCode, outputArguments, savedValuesCount = 0, pointID;
  let browseName, dataItems, paramsFile, paramFullsPath, baseParamsFile;
  //---------------------------------------------------

  if (true && params) inspector('ch_m5SyncAcmYearReport.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('ch_m5SyncAcmYearReport.value:', value);

  // Get my opcua client
  const client = params.myOpcuaClient;

  // Get params file
  pointID = value.opt.point //inputArgument.pointID;
  paramsFile = loTemplate(acmYearTemplateFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`Run script - ERROR. File with name "${chalk.cyan(paramsFile)}" not found.`);
    throw new Error(`Run script - ERROR. File with name "${paramsFile}" not found.`);
  }

  let paramsReport = require(join(...paramFullsPath));
  if (paramsReport.baseParams) {
    // Get base params file
    baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: paramsReport.baseParams });
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    if (!doesFileExist(paramFullsPath)) {
      logger.error(`Run script - ERROR. File with name "${chalk.cyan(baseParamsFile)}" not found.`);
      throw new Error(`Run script - ERROR. File with name "${baseParamsFile}" not found.`);
    }
    const baseParams = require(join(...paramFullsPath));
    paramsReport = Object.assign({}, baseParams, paramsReport);
  }

  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  const groupBrowseName = paramsReport.acmTagBrowseName;
  // Get acm tag
  const groupTag = opcuaTags.find(t => t.browseName === groupBrowseName);
  if (!groupTag) {
    logger.error(`Run script - ERROR. Tag with browseName "${chalk.cyan(groupBrowseName)}" not found.`);
    throw new Error(`Run script - ERROR. Tag with browseName "${groupBrowseName}" not found.`);
  }

  //--- Get dataItems from store or day reports ---//
  if (paramsReport.syncYearReportFromStore) {
    console.log(
      chalk.green('runCommand.ch_m5SyncAcmYearReport: OK!'),
      `For pointID=${pointID} syncStoreCount:`, chalk.cyan(10)
    );
  } else {
    //--- Run server method -> 'methodAcmDayReportsDataGet' ---//

    const opt = value.opt;

    // Set input argument
    if (opt.point) inputArgument.pointID = opt.point;
    if (opt.pattern) inputArgument.pattern = opt.pattern;

    inputArguments.push([
      {
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      }
    ]);

    browseName = 'CH_M5::AcmDayReportsDataGet';
    result = await client.sessionCallMethod(browseName, inputArguments);
    if (isDebug && result) inspector('runMetod.methodAcmDayReportsDataGet.result:', result);
    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params }
      // Get params
      pointID = outputArguments.params.pointID;
      const syncResultOutputPath = outputArguments.params.outputPath;
      // Get data items
      let outputFile = outputArguments.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];
      logger.info(
        `${chalk.greenBright('runMetod.methodAcmDayReportsDataGet: OK!')} 
        'resultFile:' ${chalk.cyan(getPathBasename(outputArguments.resultPath))}; 
        'dataItemsCount:' ${chalk.cyan(dataItems.length)};`
      );
    } else {
      logger.error(
        `runMetod.methodAcmDayReportsDataGet - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        browseName:'${chalk.cyan(browseName)}'`
      );
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.result:', result);
    }
  }

  //--- Sync acm year report ---//
  for (let index2 = 0; index2 < dataItems.length; index2++) {
    const dataItem = dataItems[index2];
    if (true && dataItem) inspector('runCommand.ch_m5SyncAcmYearReport.dataItem:', dataItem);

    // Get inputArgument
    inputArgument = {};
    params.addressSpaceOption = groupTag;
    inputArgument = JSON.stringify(loOmit(params, ['myOpcuaClient', 'app']));
    inputArgument = { dataType: DataType.String, value: inputArgument };
    // Get inputArgument2
    inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItem) };
    // Get inputArguments
    inputArguments.push([inputArgument, inputArgument2]);
    if (true && inputArguments.length) inspector('runCommand.ch_m5SyncAcmYearReport.inputArguments:', inputArguments);

    // Run server method -> methodAcmYearReportUpdate
    browseName = 'CH_M5::YearReportUpdate';
    result = await client.sessionCallMethod(browseName, inputArguments);
    if (isDebug && result) inspector('runMetod.methodAcmYearReportUpdate.result:', result);

    statusCode = result[0].statusCode.name;
    if (statusCode === 'Good') {
      outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params }
      console.log(
        chalk.green('runMetod.methodAcmYearReportUpdate: OK!'),
        'reportDate:', chalk.cyan(outputArguments.reportDate),
        'resultFile:', chalk.cyan(getPathBasename(outputArguments.resultPath))
      );
    } else {
      logger.error(
        `runMetod.methodAcmYearReportUpdate - ${chalk.red('ERROR!')} 
        statusCode:'${chalk.cyan(statusCode)}'; 
        browseName:'${chalk.cyan(browseName)}'`
      );
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.result:', result);
    }
  }
  console.log(
    chalk.green('runCommand.ch_m5SyncAcmYearReport: OK!'),
    `For pointID=${pointID} syncAcmYearReportCount:`, chalk.cyan(100)
  );
}

module.exports = ch_m5SyncAcmYearReport;
