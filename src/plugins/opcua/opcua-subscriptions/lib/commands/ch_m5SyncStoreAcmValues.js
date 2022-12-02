/* eslint-disable no-unused-vars */
// const logger = require('../../logger');
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
  isUncPath,
  getPathBasename,
  readJsonFileSync,
  removeItemsSync,
  toPathWithPosixSep
} = require('../../../../lib');

const {
  saveStoreOpcuaGroupValues
} = require('../../../../db-helpers');

const sessionCallMethod = require('../sessionCallMethod');

const debug = require('debug')('app:command.ch_m5SyncStoreAcmValues');
const isDebug = false;

/**
 * @method ch_m5CreateAcmYearTemplate
 * 
 * @param {Object} params 
 * @param {Object} value
 * @returns {void}
 */
async function ch_m5SyncStoreAcmValues(params, value) {
  let result, inputArgument = {}, inputArguments = [], outputArguments;
  let statusCode, savedValuesCount = 0, inputArgsStatusCode;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5SyncStoreAcmValues.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && value) inspector('ch_m5SyncStoreAcmValues.value:', value);

  const opt = value.opt;
  const app = params.myOpcuaClient.app;

  // Set input argument
  if (opt.point) inputArgument.pointID = opt.point;
  if (opt.pattern) inputArgument.pattern = opt.pattern;

  inputArguments.push([
    {
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    }
  ]);
  // Run server method
  const browseName = 'CH_M5::AcmDayReportsDataGet';
  
  const callMethodResult = await sessionCallMethod(params, {
    showCallMethod: false,
    methodIds: browseName,
    inputArguments
  });
  if (isDebug && callMethodResult) inspector('ch_m5SyncStoreAcmValues.callMethodResult:', callMethodResult);

  statusCode = callMethodResult.statusCode;
  inputArgsStatusCode = callMethodResult.inputArgsStatusCode;
  if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
    outputArguments = JSON.parse(callMethodResult.outputArguments[0][0].value);// { resultPath, params }
    if (isDebug && outputArguments) console.log(
      chalk.greenBright('sessionCallMethod(methodAcmDayReportsDataGet): OK!'),
      'resultFile:', getPathBasename(outputArguments.resultPath)
    );
    // Get params
    const pointID = outputArguments.params.pointID;
    const groupBrowseName = outputArguments.params.acmTagBrowseName;
    const syncResultOutputPath = outputArguments.params.outputPath;
    // Get data items
    let outputFile = outputArguments.params.outputFile;
    const currentDate = moment().format('YYYYMMDD');
    outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
    const dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];

    // Save store opcua group value
    const savedValues = await saveStoreOpcuaGroupValues(app, groupBrowseName, dataItems, true);
    if (isDebug && savedValues.length) inspector('ch_m5SyncStoreAcmValues.savedValues:', savedValues);
    savedValuesCount += savedValues.length;

    if (true && outputArguments) console.log(
      chalk.greenBright('runCommand(ch_m5SyncStoreAcmValues): OK!'),
      `For pointID=${pointID};`,
      `syncStoreCount: ${savedValuesCount};`,
      `resultFile: "${getPathBasename(outputArguments.resultPath)}"`, 
    );
    // Remove files from tmp path
    if (!isUncPath(syncResultOutputPath)) {
      const filePath = toPathWithPosixSep([appRoot, syncResultOutputPath]);
      const deletedItems = removeItemsSync([`${filePath}/*.*`, `!${filePath}/*.xlsx`], { dryRun: false });
      if (isDebug && deletedItems.length) inspector('removeItemsSync.deletedItems:', deletedItems);
    }
  } else {
    logger.error(
      `runMetod.methodAcmDayReportsDataGet - ${chalk.red('ERROR!')} 
      statusCode:'${chalk.cyan(statusCode)}'; 
      browseName:'${chalk.cyan(browseName)}'`
    );
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.inputArguments:', inputArguments);
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.callMethodResult:', callMethodResult);
  }
  return callMethodResult;
}

module.exports = ch_m5SyncStoreAcmValues;
