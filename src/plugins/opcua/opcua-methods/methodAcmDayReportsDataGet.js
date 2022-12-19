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
  isTest,
  isString,
  getRangeArray,
  getRangeStartEndOfPeriod,
  getFileStatList,
  getParams4PointID,
  cloneObject,
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
  getOpcuaConfigOptions,
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
const loDrop = require('lodash/drop');

// Get params path
let paramsPath = '/src/api/app/opcua-methods/acm-reports';

const {
  acmDayReportFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

// Get test ID
const id = 'ua-cherkassy-azot_test2';

/**
 * @method methodAcmDayReportsDataGet
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {void|Object}
 */
async function methodAcmDayReportsDataGet(inputArguments, context, callback) {
  let resultPath = '', pointID, params, argParams = {}, storeParams4Remove = [];
  let dirList = [], path, dataItem, dataItems = [], pattern = '';
  //----------------------------------------------------------------------------

  let callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: ''
    }]
  };

  if (isDebug && inputArguments.length) inspector('methodAcmDayReportsDataGet.inputArguments:', inputArguments);
  // Get params
  const inputArg = inputArguments[0].value;
  if (callback) {
    argParams = JSON.parse(inputArg);
    // When calling a method, set the property 'params.isSaveOutputFile' to true
    argParams.isSaveOutputFile = true;
    pointID = argParams.pointID;
  } else {
    pointID = inputArg;
    if (context && context.params !== undefined) argParams = context.params;
  }

  // Run method for pointID > 0
  if (pointID > 0) {
    // Get params for pointID
    params = getParams4PointID(pointID, acmDayReportFileName, paramsPath, argParams);

    // Create 'params.outputPath' path
    createPath(params.outputPath);

    // Get opcua tags 
    const opcuaTags = isTest() ? getOpcuaConfigOptions(id) : getOpcuaTags();
    const acmTag = opcuaTags.find(t => t.browseName === params.acmTagBrowseName);
    if (!acmTag) {
      logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. Tag with browseName "${chalk.cyan(params.acmTagBrowseName)}" not found.`);
      throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. Tag with browseName "${params.acmTagBrowseName}" not found.`);
    }
    // Get acm params
    const acmPath = acmTag.getterParams.acmPath;
    const _isTest = params.isTest || isTest() || acmTag.getterParams.isTest;

    params = Object.assign(params, { acmPath, isTest: _isTest });

    if (isDebug && params) inspector('methodAcmDayReportsDataGet.params:', params);

    // Get range years e.g. ['*/**/*2018_*.*', '*/**/*2019_*.*', '*/**/*2020_*.*', '*/**/*2021_*.*', '*/**/*2022_*.*']
    const dateTime = moment.utc().add(1, 'years').format('YYYY-MM-DDTHH:mm:ss');
    let rangeYears = getRangeStartEndOfPeriod(dateTime, [-5, 'years'], 'years');
    rangeYears = rangeYears.map(year => `*/**/*${year}_*.*`);
    if (isDebug && rangeYears.length) inspector('methodAcmDayReportsDataGet.rangeYears:', rangeYears);

    // Get acm path  
    const isHttp = loStartsWith(params.acmPath, 'http');
    if (isHttp) {
      const isExistsURL = await isUrlExists(params.acmPath);
      if (isExistsURL) {
        if (isDebug && isExistsURL) console.log(`isExistsURL('${params.acmPath}'): OK`);

        // Get fileNames from path for http
        pattern = loTrimEnd(params.acmPath, '/') + params.pattern;
        let urls = await httpGetFileNamesFromDir(params.acmPath, pattern, params.patternOptions);
        if (!params.isTest) {
          urls = urls.filter(url => createMatch(rangeYears)(url));
        }
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
      if (!params.isTest) {
        dirList = dirList.filter(filePath => createMatch(rangeYears)(filePath));
      }
      dirList = getFileStatList(dirList);// e.g. [{ filePath: 'c:/tmp/test.txt', fileStat: { ... updatedAt: '2022-07-26T05:46:42.827Z' ... } }]
      if (isDebug && dirList) console.log('methodAcmDayReportsDataGet.dirList.length:', dirList.length);

      // Get store params for remove
      if (!callback && context && context.storeParams) {
        // Drop begin item from array
        if (context.test4Remove) {
          dirList = loDrop(dirList);
        }
        storeParams4Remove = context.storeParams.filter(param => {
          const findedStoreParam = dirList.find(item => getPathBasename(item.filePath) === param.fileName);
          if (!findedStoreParam) return true;
          return false;
        });
        if (isDebug && storeParams4Remove.length) inspector('methodAcmDayReportsDataGet.storeParams4Remove:', storeParams4Remove);
      }

      // context.storeParams e.g. -> [{ dateTime: '2022-02-22', fileName: 'DayHist01_23F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:42.827Z' }... ] 
      if (!callback && context && context.storeParams) {
        // Filter the dirList with storeParams
        dirList = dirList.filter(item => {
          const fileName = getPathBasename(item.filePath);
          const findedStoreParam = context.storeParams.find(param => param.fileName === fileName);
          if (isDebug && findedStoreParam) inspector('methodAcmDayReportsDataGet.findedStoreParam:', findedStoreParam);
          if (!findedStoreParam) return true;
          if (findedStoreParam.updatedAt !== item.fileStat.updatedAt) return true;
          return false;
        });
        if (isDebug && dirList) console.log('methodAcmDayReportsDataGet.filterDirList.length:', dirList.length);
      }
    }
    if (isDebug && dirList) inspector('methodAcmDayReportsDataGet.DirList:', dirList);

    // Convert xls data to json data 
    for (let index = 0; index < dirList.length; index++) {

      const xlsPath = isString(dirList[index]) ? dirList[index] : dirList[index].filePath;
      const updatedAt = isString(dirList[index]) ? '' : dirList[index].fileStat.updatedAt;
      const fileName = isString(dirList[index]) ? getPathBasename(dirList[index]) : getPathBasename(dirList[index].filePath);

      if (!doesFileExist(xlsPath)) {
        logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(xlsPath)}" not found.`);
        throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${xlsPath}" not found.`);
      }

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
        if (isDebug && dateTime) console.log('methodAcmDayReportsDataGet.sheetDateTime:', dateTime);
        dateTime = dateTime[0]['A'].split('to:')[1].trim();
        dateTime = moment.utc(dateTime).format('YYYY-MM-DD');
        if (isDebug && dateTime) console.log('methodAcmDayReportsDataGet.dateTime:', dateTime);

        // Convert alias list to browseName list
        const variableList = opcuaTags.filter(t => t.ownerGroup === acmTag.browseName);
        dataItem = convertAliasListToBrowseNameList(variableList, dataItem);
        dataItem['!value'] = updatedAt ? { dateTime, updatedAt, fileName } : { dateTime, fileName };
        if (isDebug && dataItem) inspector(`methodAcmDayReportsDataGet.dataItem('${acmTag.browseName}'):`, dataItem);

        dataItems.push(dataItem);
      }
    }

    if (isDebug && dataItems) inspector('methodAcmDayReportsDataGet.dataItems:', dataItems);

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
    if (callback) {
      callMethodResult.outputArguments[0].value = params.isSaveOutputFile ? JSON.stringify({ resultPath, params }) : JSON.stringify({ params, dataItems });
      callback(null, callMethodResult);
    } else {
      const statusCode = 'Good';
      return params.isSaveOutputFile ? { statusCode, resultPath, params, storeParams4Remove } : { statusCode, params, dataItems, storeParams4Remove };
    }
  } 
  // Run method for pointID = 0
  if (pointID === 0) {
    // Get array of valid tags 
    const arrayOfValidTags = getRangeArray(4, 1).map(pointID => getParams4PointID(pointID, acmDayReportFileName, paramsPath).acmTagBrowseName);
    // CallBack
    if (callback) {
      callMethodResult.outputArguments[0].value = JSON.stringify({ params: { arrayOfValidTags } });
      callback(null, callMethodResult);
    } else {
      const statusCode = 'Good';
      return { statusCode, params: { arrayOfValidTags } };
    }
  }
}

module.exports = methodAcmDayReportsDataGet;
