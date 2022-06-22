/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');
const logger = require('../../../logger');

const {
  appRoot,
  inspector,
  doesFileExist,
  makeDirSync
} = require('../../lib');

const {
  ExceljsHelperClass,
} = require('../../excel-helpers');

const {
  DataType,
  StatusCodes,
} = require('node-opcua');


const loForEach = require('lodash/forEach');
const loTemplate = require('lodash/template');
const loOmit = require('lodash/omit');

const dataTestPath = '/test/data/tmp/excel-helper';
let dataPath = '/src/api/app/opcua-methods/asm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

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
  let pointID;
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
    console.log(chalk.redBright(`Run script - ERROR. File with name "${paramsFile}" not found.`));
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

  baseParamsFile = loTemplate(acmDayReportFileName)({ pointID: params.baseParams });
  paramFullsPath = [appRoot, paramsPath, baseParamsFile];
  if (!doesFileExist(paramFullsPath)) {
    console.log(chalk.redBright(`Run script - ERROR. File with name "${baseParamsFile}" not found.`));
    throw new Error(`Run script - ERROR. File with name "${baseParamsFile}" not found.`);
  }
  const baseParams = require(join(...paramFullsPath));
  params = Object.assign({}, baseParams, params);


  if (isDebug && params) inspector('methodAcmDayReportsDataGet.params:', params);

  // Write new data to xlsx file
  const currentDate = moment().format('YYYYMMDD');
  const outputFile = loTemplate(params.outputFile)({ pointID: params.pointID, date: currentDate });
  // resultPath = 
  if (params.isTest) {
    resultPath = join(...[appRoot, dataTestPath, outputFile]);
  } else{
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
