/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');
const logger = require('../../../logger');

const {
  appRoot,
  inspector,
  pause,
  getRangeStartEndOfPeriod,
  orderByItems,
  doesFileExist,
  getPathBasename,
  writeFileStream,
  writeJsonFileSync,
  getFileListFromDir,
  createMatch,
  isUncPath,
  isUrlExists,
  createPath,
  stripSlashes,
  removeItemsSync,
  toPathWithPosixSep,
  httpGetFileNamesFromDir,
  httpGetFileFromUrl
} = require('../../lib');

const {
  getOpcuaTags,
  convertAliasListToBrowseNameList
} = require('../../opcua/opcua-helper');

const {
  XlsxHelperClass
} = require('../../excel-helpers');

const {
  DataType,
  StatusCodes,
} = require('node-opcua');


const loTemplate = require('lodash/template');
const loStartsWith = require('lodash/startsWith');
const loTrimEnd = require('lodash/trimEnd');
const loForEach = require('lodash/forEach');

let paramsPath = '/src/api/app/opcua-methods/acm-reports';

const {
  acmDayReportFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

/**
 * @method methodAcmDayReportsDataGet
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {void|Object}
 */
async function methodAcmDayReportsDataGet(inputArguments, context, callback) {
  let resultPath = '', paramsFile, baseParamsFile, params = null, paramFullsPath;
  let pointID, dirList = [], path, dataItem, dataItems = [], dataItemHashes = [], pattern = '';
  //----------------------------------------------------------------------------

  if (isDebug && inputArguments.length) inspector('methodAcmDayReportsDataGet.inputArguments:', inputArguments);
  // Get params
  const inputArg = inputArguments[0].value;
  if (callback) {
    params = JSON.parse(inputArg);
    // When calling a method, set the property 'params.isSaveOutputFile' to true
    params.isSaveOutputFile = true;
    pointID = params.pointID;
  } else {
    pointID = inputArg;
  }
  // Get params data
  paramsFile = loTemplate(acmDayReportFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(paramsFile)}" not found.`);
    throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${paramsFile}" not found.`);
  }

  const _params = require(join(...paramFullsPath));

  if (params) {
    params = Object.assign({}, _params, params);
  } else {
    params = Object.assign({}, _params);
  }

  if (params.baseParams) {
    // Get base params file 
    baseParamsFile = loTemplate(acmDayReportFileName)({ pointID: params.baseParams });
    if (baseParamsFile !== paramsFile) {
      paramFullsPath = [appRoot, paramsPath, baseParamsFile];
      if (!doesFileExist(paramFullsPath)) {
        logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(baseParamsFile)}" not found.`);
        throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${baseParamsFile}" not found.`);
      }
      const baseParams = require(join(...paramFullsPath));
      params = Object.assign({}, baseParams, params);
    }
  }

  // Create 'params.outputPath' path
  createPath(params.outputPath);

  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  const acmTag = opcuaTags.find(t => t.browseName === params.acmTagBrowseName);
  if (!acmTag) {
    logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. Tag with browseName "${chalk.cyan(params.acmTagBrowseName)}" not found.`);
    throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. Tag with browseName "${params.acmTagBrowseName}" not found.`);
  }
  // Get acm params
  const acmPath = acmTag.getterParams.acmPath;
  params = Object.assign(params, { acmPath });

  if (isDebug && params) inspector('methodAcmDayReportsDataGet.params:', params);

  // Get range years e.g. ['*/**/*2018_*.*', '*/**/*2019_*.*', '*/**/*2020_*.*', '*/**/*2021_*.*', '*/**/*2022_*.*']
  const dateTime = moment.utc().subtract(4, 'years').format('YYYY-MM-DDTHH:mm:ss');
  let rangeYears = getRangeStartEndOfPeriod(dateTime, [5, 'years'], 'year');
  rangeYears = rangeYears.map(year => `*/**/*${year}_*.*`);

  // Get acm path  
  const isHttp = loStartsWith(params.acmPath, 'http');
  if (isHttp) {
    const isExistsURL = await isUrlExists(params.acmPath, true);
    if (isExistsURL) {
      if (isDebug && isExistsURL) console.log(`isExistsURL('${params.acmPath}'): OK`);

      // Get fileNames from path for http
      pattern = loTrimEnd(params.acmPath, '/') + params.pattern;
      // let urls = await httpGetFileNamesFromDir(params.acmPath, pattern, params.patternOptions);
      let urls = await httpGetFileNamesFromDir(params.acmPath, pattern, params.patternOptions);
      urls = urls.filter(url => createMatch(rangeYears)(url));
      if (isDebug && urls.length) console.log('httpGetFileNamesFromDir.urls:', urls);

      // Get files from urls
      for (let index = 0; index < urls.length; index++) {
        const fileName = getPathBasename(urls[index]);
        if (fileName) {
          const resultData = await httpGetFileFromUrl({
            url: urls[index],
            method: 'get',
            responseType: 'stream'
          });
          // Write file stream
          resultPath = join(...[appRoot, params.outputPath, fileName]);
          resultPath = writeFileStream(resultPath, resultData);
          dirList.push(resultPath);
          await pause(100);
        }
      }
    }
  } else {
    path = isUncPath(params.acmPath) ? params.acmPath : toPathWithPosixSep([appRoot, params.acmPath]);
    path = loTrimEnd(path, '\\/');
    pattern = path + params.pattern;
    if (isDebug && path) inspector('methodAcmDayReportsDataGet.path:', path);
    dirList = getFileListFromDir(path, pattern, params.patternOptions);
    dirList = dirList.filter(url => createMatch(rangeYears)(url));

    if (isDebug && dirList.length) inspector('methodAcmDayReportsDataGet.dirList:', dirList);
  }

  // Convert xls data to json data 
  for (let index = 0; index < dirList.length; index++) {
    // if (index > 0) break;
    const xlsPath = dirList[index];
    if (!doesFileExist(xlsPath)) {
      logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(xlsPath)}" not found.`);
      throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${xlsPath}" not found.`);
    }

    try {
      // Create xlsx object
      let xlsx = new XlsxHelperClass({
        excelPath: xlsPath,
        sheetName: 'Report1'
      });

      // Sheet to json data
      dataItem = xlsx.sheetToJson('Report1', { range: params.rangeData, header: params.headerNames });
      if (isDebug && dataItem.length) inspector(`methodAcmDayReportsDataGet.dataItems(${dataItem.length}):`, dataItem);

      if (!dataItem.length) {
        logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}.  Error - dataItem is empty . Excel path: '${xlsPath}'.`);
        params.errorFilePaths.push(xlsPath);
      }

      if (dataItem.length) {
        // Sheet to json date
        let dateTime = xlsx.sheetToJson('Report1', { range: params.rangeDate });
        dateTime = dateTime[0]['A'].split('to:')[0].split('from:')[1].trim();
        dateTime = moment.utc(dateTime).format('YYYY-MM-DD');
        if (isDebug && dateTime) console.log('methodAcmDayReportsDataGet.dateTime:', dateTime);

        // Convert alias list to browseName list
        const variableList = opcuaTags.filter(t => t.ownerGroup === acmTag.browseName);
        dataItem = convertAliasListToBrowseNameList(variableList, dataItem);
        dataItem['!value'] = { dateTime };
        if (isDebug && dataItem) inspector(`methodAcmDayReportsDataGet.dataItem('${acmTag.browseName}'):`, dataItem);

        dataItems.push(dataItem);
      }
    } catch (error) {
      logger.error(
        `RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}.  Error while creating an instance of a class 'XlsxHelperClass'. Excel path: '${xlsPath}'.`
      );
      if (true && error) console.log('ERROR.methodAcmDayReportsDataGet.message:', error.message);
      if (isDebug && dataItems.length) inspector('ERROR.methodAcmDayReportsDataGet.dataItems:', dataItems);
    }
  }

  if (isDebug && dataItems.length) inspector('methodAcmDayReportsDataGet.dataItems:', dataItems);

  // Set hash data for dataItems
  if (dataItems.length) {
    // Sort dataItems
    dataItems = orderByItems(dataItems, item => item['!value']['dateTime'], ['asc']);
    if (isDebug && dataItems) inspector('methodAcmDayReportsDataGet.sortDataItems:', dataItems);
    for (let index = 0; index < dataItems.length; index++) {
      const dataItem = dataItems[index];// browseName
      loForEach(dataItem, function (value, key) {

      });
    }
  }

  // Remove files from dir
  if (params.isRemoveXlsFiles) {
    removeItemsSync(`${params.outputPath}/*.xls`, { dryRun: false });
  }

  // Write data to resultPath
  if (params.isSaveOutputFile) {
    const currentDate = moment().format('YYYYMMDD');
    const outputFile = loTemplate(params.outputFile)({ pointID: params.pointID, date: currentDate });
    // Get result path 
    resultPath = join(...[appRoot, params.outputPath, outputFile]);
    // Write json file
    writeJsonFileSync(resultPath, { statusCode: 'Good', resultPath, params, dataItems });
  }

  // CallBack
  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: params.isSaveOutputFile ? JSON.stringify({ resultPath, params }) : JSON.stringify({ params, dataItems })
    }]
  };
  if (callback) {
    callback(null, callMethodResult);
  } else {
    const statusCode = 'Good';
    return params.isSaveOutputFile ? { statusCode, resultPath, params } : { statusCode, params, dataItems };
  }
}

module.exports = methodAcmDayReportsDataGet;
