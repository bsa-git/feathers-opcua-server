/* eslint-disable no-unused-vars */
const fs = require('fs');
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');
const logger = require('../../../logger');

const {
  appRoot,
  inspector,
  pause,
  doesFileExist,
  getPathBasename,
  writeFileStream,
  getFileListFromDir,
  isUncPath,
  isUrlExists,
  makeDirSync,
  httpGetFileNamesFromDir,
  httpGetFileFromUrl
} = require('../../lib');

const {
  getOpcuaTags,
} = require('../../opcua/opcua-helper');

const {
  XlsxHelperClass
} = require('../../excel-helpers');

const {
  DataType,
  StatusCodes,
} = require('node-opcua');


const loForEach = require('lodash/forEach');
const loTemplate = require('lodash/template');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');

const dataTestPath = '/test/data/tmp/excel-helper';
let dataPath = '/src/api/app/opcua-methods/acm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/acm-reports/params';

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
  let pointID, dirList = [], path;
  //----------------------------------------------------------------------------

  if (isDebug && inputArguments.length) inspector('methodAcmDayReportsDataGet.inputArguments:', inputArguments);
  // Get params
  const inputArg = inputArguments[0].value;
  if (callback) {
    params = JSON.parse(inputArg);
    pointID = params.pointID;
  } else {
    pointID = inputArg;
  }
  // Get params data
  paramsFile = loTemplate(acmDayReportFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(chalk.redBright(`Run script - ERROR. File with name "${paramsFile}" not found.`));
    throw new Error(`Run script - ERROR. File with name "${paramsFile}" not found.`);
  }

  const _params = require(join(...paramFullsPath));

  if (params) {
    params = Object.assign({}, _params, params);
  } else {
    params = Object.assign({}, _params);
  }


  if (!params.baseParams) {
    params.baseParams = 1;
  }
  // Get base params file 
  baseParamsFile = loTemplate(acmDayReportFileName)({ pointID: params.baseParams });
  if (baseParamsFile !== paramsFile) {
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    if (!doesFileExist(paramFullsPath)) {
      console.log(chalk.redBright(`Run script - ERROR. File with name "${baseParamsFile}" not found.`));
      throw new Error(`Run script - ERROR. File with name "${baseParamsFile}" not found.`);
    }
    const baseParams = require(join(...paramFullsPath));
    params = Object.assign({}, baseParams, params);
  }

  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  const acmTag = opcuaTags.find(t => t.browseName === params.acmTagBrowseName);
  if (!acmTag) {
    logger.error(chalk.redBright(`Run script - ERROR. Tag with browseName "${params.acmTagBrowseName}" not found.`));
    throw new Error(`Run script - ERROR. Tag with browseName "${params.acmTagBrowseName}" not found.`);
  }
  // Get acm params
  const acmPath = acmTag.getterParams.acmPath;
  params = Object.assign(params, { acmPath });

  if (true && params) inspector('methodAcmDayReportsDataGet.params:', params);

  // Get acm path  
  const isHttp = loStartsWith(params.acmPath, 'http');
  if (isHttp) {
    const isExistsURL = await isUrlExists(params.acmPath, true);
    if (isExistsURL) {
      if (isDebug && isExistsURL) logger.info(`isExistsURL('${params.acmPath}'): OK`);

      // Get fileNames from path for http
      const urls = await httpGetFileNamesFromDir(params.acmPath);
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
          resultPath = join(...[appRoot, dataTestPath, fileName]);
          resultPath = writeFileStream(resultPath, resultData);
          dirList.push(resultPath);
          await pause();
        }
      }
    }
  } else {
    path = isUncPath(params.acmPath) ? params.acmPath : join(...[appRoot, params.acmPath]);
    if (isDebug && path) inspector('methodAcmDayReportsDataGet.path:', path);
    dirList = getFileListFromDir(path);
    if (true && dirList.length) inspector('methodAcmDayReportsDataGet.dirList:', dirList);
  }

  // Convert xls data to json data 
  for (let index = 0; index < dirList.length; index++) {
    const xlsPath = dirList[index];
    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: xlsPath,
      sheetName: 'Report1'
    });

    // Sheet to json data
    const dataItems = xlsx.sheetToJson('Report1', { range: params.rangeData, header: params.headerNames });
    if (true && dataItems.length) inspector(`methodAcmDayReportsDataGet.dataItems(${dataItems.length}):`, dataItems);

    // Sheet to json date
    let dateTime = xlsx.sheetToJson('Report1', { range: params.rangeDate });
    dateTime = dateTime[0]['A'].split('to:')[0].split('from:')[1].trim();
    dateTime = moment.utc(dateTime).format('YYYY-MM-DD');
    if (true && dateTime) console.log('methodAcmDayReportsDataGet.dateTime:', dateTime);

    
  }



  // Write new data to xlsx file
  const currentDate = moment().format('YYYYMMDD');
  const outputFile = loTemplate(params.outputFile)({ pointID: params.pointID, date: currentDate });
  // resultPath = 
  if (params.isTest) {
    resultPath = join(...[appRoot, dataTestPath, outputFile]);
  } else {
    resultPath = join(...[appRoot, dataPath, outputFile]);
  }

  // CallBack
  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: JSON.stringify({ resultPath, params })
    }]
  };
  if (callback) {
    callback(null, callMethodResult);
  } else {
    const statusCode = 'Good';
    return { statusCode, resultPath, params };
  }
}

module.exports = methodAcmDayReportsDataGet;
