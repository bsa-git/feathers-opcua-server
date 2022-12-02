/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');

const loOmit = require('lodash/omit');
const loTemplate = require('lodash/template');
const loStartsWith = require('lodash/startsWith');

const {
  DataType,
} = require('node-opcua');

const {
  appRoot,
  inspector,
  logger,
  isUncPath,
  getPathBasename,
  readJsonFileSync,
  removeItemsSync,
  doesFileExist,
  toPathWithPosixSep,
  isValidDateTime
} = require('../../../../lib');

const {
  getOpcuaTagValuesFromStores
} = require('../../../../db-helpers');

const {
  getOpcuaTags
} = require('../../../../opcua/opcua-helper');

let paramsPath = '/src/api/app/opcua-methods/acm-reports';

const {
  acmYearTemplateFileName,
} = require(join(...[appRoot, paramsPath]));

const sessionCallMethod = require('../sessionCallMethod');

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
  let metodResult, inputArgument, inputArgument2, inputArguments, outputArguments;
  let statusCode, inputArgsStatusCode, pointID, pattern, isTest;
  let metodBrowseName, dataItems, paramsFile, paramFullsPath, baseParamsFile;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5SyncAcmYearReport.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && value) inspector('ch_m5SyncAcmYearReport.value:', value);

  // Get app
  const app = params.myOpcuaClient.app;

  // Get params file
  pointID = value.opt.point;
  pattern = value.opt.pattern;
  isTest = !!value.opt.test;
  paramsFile = loTemplate(acmYearTemplateFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`RunCommand(ch_m5SyncAcmYearReport): ${chalk.error('ERROR')}! File with name "${chalk.cyan(paramsFile)}" not found.`);
    throw new Error(`RunCommand(ch_m5SyncAcmYearReport): ERROR. File with name "${paramsFile}" not found.`);
  }

  let reportParams = require(join(...paramFullsPath));
  if (reportParams.baseParams) {
    // Get base params file
    baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: reportParams.baseParams });
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    if (!doesFileExist(paramFullsPath)) {
      logger.error(`RunCommand(ch_m5SyncAcmYearReport): ${chalk.error('ERROR')}! File with name "${chalk.cyan(baseParamsFile)}" not found.`);
      throw new Error(`RunCommand(ch_m5SyncAcmYearReport): ERROR. File with name "${baseParamsFile}" not found.`);
    }
    const baseParams = require(join(...paramFullsPath));
    reportParams = Object.assign({}, baseParams, reportParams);
  }
  // Set syncYearReportFromStore prop
  if (value.opt.syncYearReportFromStore !== undefined) {
    reportParams.syncYearReportFromStore = value.opt.syncYearReportFromStore;
  }
  if (isDebug && reportParams) inspector('ch_m5SyncAcmYearReport.reportParams:', reportParams);


  //--- Get dataItems ---//
  if (reportParams.syncYearReportFromStore) {

    //--- Get dataItems from store ---//
    const opcuaTags = getOpcuaTags();
    const groupBrowseName = reportParams.acmTagBrowseName;
    const storeBrowseNames = opcuaTags.filter(t => t.ownerGroup === groupBrowseName).map(t => t.browseName);
    dataItems = await getOpcuaTagValuesFromStores(app, storeBrowseNames);
    if (isDebug && dataItems) inspector('ch_m5SyncAcmYearReport.dataItems:', dataItems);
    // Get filter dataItems
    if (dataItems.length && pattern && isValidDateTime(pattern)) {
      const patterns = pattern.split('-');
      dataItems = dataItems.filter(item => {
        const date = item['!value']['dateTime'];
        if (patterns.length === 1) return loStartsWith(date, patterns[0]);
        if (patterns.length === 2) return loStartsWith(date, `${patterns[0]}-${patterns[1]}`);
        if (patterns.length === 3) return loStartsWith(date, `${patterns[0]}-${patterns[1]}-${patterns[2]}`);
      });
      if (isDebug && dataItems) inspector(`ch_m5SyncAcmYearReport.dataItems.filter(pattern: "${pattern}"):`, dataItems);
    }
    if (isDebug && dataItems.length) console.log(
      chalk.greenBright('RunCommand(ch_m5SyncAcmYearReport).getOpcuaTagValuesFromStores: OK!'),
      `For pointID=${pointID};`,
      `pattern: '${pattern}';`,
      `dataItemsCount: ${dataItems.length};`
    );

  } else {

    //--- Run server method -> 'methodAcmDayReportsDataGet' ---//

    // Set input argument
    inputArgument = { pointID, pattern };
    inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };
    inputArguments = [];
    inputArguments.push([inputArgument]);

    metodBrowseName = 'CH_M5::AcmDayReportsDataGet';
    // metodResult = await client.sessionCallMethod(metodBrowseName, inputArguments);
    metodResult = await sessionCallMethod(params, {
      showCallMethod: false,
      methodIds: metodBrowseName,
      inputArguments
    });

    if (isDebug && metodResult) inspector('runMetod.methodAcmDayReportsDataGet.metodResult:', metodResult);
    // statusCode = metodResult[0].statusCode.name;
    statusCode = metodResult.statusCode;
    inputArgsStatusCode = metodResult.inputArgsStatusCode;
    if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
      // outputArguments = JSON.parse(metodResult[0].outputArguments[0].value);// { resultPath, params }
      outputArguments = JSON.parse(metodResult.outputArguments[0][0].value);// { resultPath, params }
      if (isDebug && outputArguments) inspector('runMetod.methodAcmDayReportsDataGet.outputArguments:', outputArguments);
      // Get params
      pointID = outputArguments.params.pointID;
      const syncResultOutputPath = outputArguments.params.outputPath;
      // Get data items
      let outputFile = outputArguments.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];
      if (isDebug && dataItems.length) console.log(
        chalk.greenBright('RunCommand(ch_m5SyncAcmYearReport).methodAcmDayReportsDataGet: OK!'),
        `resultFile: '${getPathBasename(outputArguments.resultPath)}';`,
        `dataItemsCount: ${dataItems.length};`
      );
    } else {
      logger.error(
        `RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}! 
        statusCode:'${statusCode}'; 
        inputArgsStatusCode:'${inputArgsStatusCode}'; 
        metodBrowseName:'${metodBrowseName}';`
      );
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
      inspector('runMetod.methodAcmDayReportsDataGet.ERROR.metodResult:', metodResult);
      return;
    }
  }

  if (!dataItems.length) {
    logger.error(`RunCommand(ch_m5SyncAcmYearReport): ${chalk.red('ERROR')}! dataItems is empty!`);
    return;
  }

  //--- Run server method -> 'methodAcmYearReportUpdate' ---//

  // Set inputArguments
  inputArgument = { pointID, isTest };
  inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };

  inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
  inputArguments = [];
  inputArguments.push([inputArgument, inputArgument2]);
  if (isDebug && inputArguments.length) inspector('runCommand.ch_m5SyncAcmYearReport.inputArguments:', inputArguments);

  // Run server method
  metodBrowseName = 'CH_M5::YearReportUpdate';
  // metodResult = await client.sessionCallMethod(metodBrowseName, inputArguments);
  metodResult = await sessionCallMethod(params, {
    showCallMethod: false,
    methodIds: metodBrowseName,
    inputArguments
  });
  if (isDebug && metodResult) inspector('runMetod.methodAcmYearReportUpdate.metodResult:', metodResult);

  statusCode = metodResult.statusCode;
  inputArgsStatusCode = metodResult.inputArgsStatusCode;
  if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
    outputArguments = JSON.parse(metodResult.outputArguments[0][0].value);// [{ statusCode, resultPath, params, reportYear, reportDates }, ...]
    if (isDebug && outputArguments) inspector('runMetod.methodAcmYearReportUpdate.outputArguments:', outputArguments);

    // Remove files from tmp path
    if (!reportParams.syncYearReportFromStore && !isUncPath(reportParams.dataTestPath)) {
      const filePath = toPathWithPosixSep([appRoot, reportParams.dataTestPath]);
      const deletedItems = removeItemsSync([`${filePath}/*.*`, `!${filePath}/*.xlsx`], { dryRun: false });
      if (isDebug && deletedItems.length) inspector('removeItemsSync.deletedItems:', deletedItems);
    }
  } else {
    logger.error(
      `RunMetod(methodAcmYearReportUpdate): ${chalk.red('ERROR')}! 
        statusCode:'${statusCode}'; 
        inputArgsStatusCode:'${inputArgsStatusCode}'; 
        metodBrowseName:'${metodBrowseName}';`
    );
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.metodResult:', metodResult);
    return;
  }
  const outputArgument = Array.isArray(outputArguments) ? outputArguments[0] : outputArguments;
  if (true && outputArguments) console.log(
    chalk.greenBright('RunCommand(ch_m5SyncAcmYearReport): OK!'),
    `For pointID=${pointID};`,
    `syncAcmYearReportCount: ${outputArgument.reportDates.length};`
  );
}

module.exports = ch_m5SyncAcmYearReport;
