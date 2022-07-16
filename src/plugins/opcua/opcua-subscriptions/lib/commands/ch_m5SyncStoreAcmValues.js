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
  saveStoreOpcuaGroupValue
} = require('../../../../db-helpers');

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
  let result, inputArgument = {}, inputArguments = [];
  let statusCode, outputArguments, savedValuesCount = 0;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5SyncStoreAcmValues.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('ch_m5SyncStoreAcmValues.value:', value);

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
  // Run server method
  const client = params.myOpcuaClient;
  const browseName = 'CH_M5::AcmDayReportsDataGet';
  result = await client.sessionCallMethod(browseName, inputArguments);
  if (isDebug && result) inspector('ch_m5SyncStoreAcmValues.sessionCallMethod.result:', result);

  statusCode = result[0].statusCode.name;
  if (statusCode === 'Good') {
    outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params }
    if (isDebug && outputArguments) console.log(
      chalk.green('sessionCallMethod(methodAcmDayReportsDataGet): OK!'),
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
    const dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];

    // Save store opcua group value
    for (let index2 = 0; index2 < dataItems.length; index2++) {
      const dataItem = dataItems[index2];
      if (isDebug && dataItem) inspector('runCommand.ch_m5SyncStoreAcmValues.dataItem:', dataItem);
      const savedValues = await saveStoreOpcuaGroupValue(params.app, groupBrowseName, dataItem, false);
      savedValuesCount += savedValues.length;
      if (isDebug && savedValues.length) inspector('runCommand.ch_m5SyncStoreAcmValues.savedValues:', savedValues);
    }
    if (isDebug && outputArguments) console.log(
      chalk.green('runCommand(ch_m5SyncStoreAcmValues): OK!'),
      `For pointID=${chalk.cyan(pointID)};`,
      `syncStoreCount: ${chalk.cyan(savedValuesCount)};`
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
    inspector('runMetod.methodAcmDayReportsDataGet.ERROR.result:', result);
  }
  return result;
}

module.exports = ch_m5SyncStoreAcmValues;
