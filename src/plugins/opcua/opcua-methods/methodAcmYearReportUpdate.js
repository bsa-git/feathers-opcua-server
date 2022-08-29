/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const moment = require('moment');

const {
  appRoot,
  inspector,
  logger,
  isTest,
  doesFileExist,
  makeDirSync,
  getParams4PointID,
  getRangeArray,
  orderByItems,
  getRangeStartEndOfPeriod,
  getTimeDurations,
  isUncPath,
  toPathWithPosixSep,
  removeItemsSync
} = require('../../lib');

const {
  getOpcuaTags,
  getOpcuaConfigOptions,
} = require('../../opcua/opcua-helper');

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
const loStartsWith = require('lodash/startsWith');

// Get params path
let paramsPath = '/src/api/app/opcua-methods/acm-reports';

const {
  acmYearTemplateFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

// Get test ID
const id = 'ua-cherkassy-azot_test2';

/**
 * @method updateYearReport
 * @param {Number} pointID 
 * @param {Object} reportParams 
 * @param {Object[]} groupValues 
 * @returns {Object}
 * e.g. { resultPath: 'c:/tmp/acmYearReport2-2022.xlsx', reportYear: '2022', reportDates: ['2022-01-01',...,'2022-12-31' ] } 
 */
const updateYearReport = async function (pointID, reportParams, groupValues) {
  let reportFile, reportDates = [], timeList = [], methodResult = {};
  let dateCells, dataCells, dataCells4Rows, dateCells4Date;
  //-------------------------------------------------------------------

  // Get begin group value 
  const beginGroupValue = groupValues[0];
  // Get begin report date and year
  const beginReportDate = beginGroupValue['!value'].dateTime.split('T')[0];
  const beginReportYear = beginReportDate.split('-')[0];

  // Get output report path
  const outputReportPath = reportParams.isTest ? reportParams.dataTestPath : reportParams.dataPath;

  // Get report file
  const outputReportFile = loTemplate(reportParams.outputReportFile)({ pointID, year: beginReportYear });
  reportFile = [appRoot, outputReportPath, outputReportFile];
  if (!doesFileExist(reportFile)) {
    const outputTemplateFile = loTemplate(reportParams.outputTemplateFile)({ pointID, year: beginReportYear });
    reportFile = [appRoot, outputReportPath, outputTemplateFile];
    if (!doesFileExist(reportFile)) {
      reportFile = reportParams.isTest ? [appRoot, reportParams.inputPath, outputTemplateFile] : [appRoot, reportParams.dataPath, outputTemplateFile];

    }
  }
  reportFile = join(...reportFile);

  if (!doesFileExist(reportFile)) {
    logger.error(`There is no file "${chalk.cyan(reportFile)}" for the reporting period on the automated monitoring system.`);
    new Error(`There is no file "${reportFile}" for the reporting period on the automated monitoring system.`);
  }

  // TimeDuration_start
  timeList.push(moment.utc().format());

  // Create exceljs object
  const exceljs = new ExceljsHelperClass({
    excelPath: reportFile,
    sheetName: 'Data_CNBB',
    bookOptions: {
      fullCalcOnLoad: true
    }
  });
  await exceljs.init();
  let sheetName = exceljs.getSheet().name;
  // Get range of cells for report date     
  const startRow = reportParams.startRow;
  const dateColumn = reportParams.dateColumn;
  // const dataStartColumn = reportParams.dataStartColumn;
  const dataEndColumn = reportParams.dataEndColumn;

  // Get actual row count
  const metrics = exceljs.getSheetMetrics();
  if (isDebug && metrics) inspector('metrics:', metrics);

  // TimeDuration_1
  timeList.push(moment.utc().format());

  // Get cells for report date/data
  dataCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dataEndColumn}${metrics.rowCount}` });
  dateCells = dataCells.filter(cell => cell.address2.col === dateColumn && (cell.address2.row >= startRow && cell.address2.row <= metrics.rowCount));

  // TimeDuration_2
  timeList.push(moment.utc().format());

  for (let index = 0; index < groupValues.length; index++) {
    const groupValue = groupValues[index];
    // Get report date and year
    const reportDate = groupValue['!value'].dateTime.split('T')[0];
    reportDates.push(reportDate);

    dateCells4Date = dateCells.filter(dateCell => dateCell.value === reportDate);
    // Show cells
    loForEach(dateCells4Date, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (isDebug && cell) inspector(`methodAcmYearReportUpdate.cell(${cell.address}):`, cell);
    });

    if (!dateCells4Date.length) break;

    // Get start/end row for report date  
    const startRow4Date = dateCells4Date[0]['address2'].row;
    const endRow4Date = dateCells4Date[dateCells4Date.length - 1]['address2'].row;

    // Set cell value to groupValue
    loForEach(reportParams.dataColumns, function (column, alias) {
      // Get data cells for rows
      dataCells4Rows = dataCells.filter(cell => cell.address2.col === column && (cell.address2.row >= startRow4Date && cell.address2.row <= endRow4Date));

      // Set values to cells
      loForEach(groupValue, function (items, tag) {
        let tagAlias = tag.split(':');
        tagAlias = tagAlias[tagAlias.length - 1];
        if ((tagAlias === alias) && (dataCells4Rows.length === items.length)) {
          for (let index2 = 0; index2 < items.length; index2++) {
            const item = items[index2];
            dataCells4Rows[index2].cell.value = item;
            dataCells4Rows[index2].value = item;
          }
        }
      });

      // Set values for 'CHBB'
      if (alias.includes('CHBB')) {
        for (let index3 = 0; index3 < dataCells4Rows.length; index3++) {
          const dateCell = dataCells4Rows[index3];
          dateCell.cell.value = 1;
          dateCell.value = 1;
        }
      }
    });
  }

  // TimeDuration_end
  timeList.push(moment.utc().format());

  // Write report file
  const resultPath = await exceljs.writeFile([appRoot, outputReportPath, outputReportFile]);
  if (isDebug && resultPath) console.log(
    chalk.green('Update asm year report - OK!'),
    'reportDates:', chalk.cyan(reportDates.length),
    'resultFile:', chalk.cyan(outputReportFile)
  );

  methodResult = { resultPath, reportYear: beginReportYear, reportDates };
  if (isDebug && methodResult) inspector('methodAcmYearReportUpdate.methodResult:', methodResult);
  if (isDebug && timeList.length) inspector('methodAcmYearReportUpdate.timeDurations:', getTimeDurations(timeList));

  return methodResult;
};

/**
 * Update acm year report
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {void|Object}
 */
async function methodAcmYearReportUpdate(inputArguments, context, callback) {
  let reportParams = null, timeList = [], deletedItems = [];
  let beginReportDate, methodResult = null, methodResults = [];
  //---------------------------------------------------------------

  if (isDebug && inputArguments.length) inspector('methodAcmYearReportUpdate.inputArguments:', inputArguments);

  let callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: ''
    }]
  };

  // Get params and group value
  if (!callback) {
    inputArguments = inputArguments[0];
  }
  const params = JSON.parse(inputArguments[0].value);
  let groupValues = JSON.parse(inputArguments[1].value);
  if (!Array.isArray(groupValues)) {
    groupValues = [groupValues];
  }
  if (isDebug && params) inspector('methodAcmYearReportUpdate.params:', params);
  if (isDebug && inputArguments) inspector('methodAcmYearReportUpdate.groupValues:', groupValues);

  // Get pointID 
  const pointID = params.pointID;

  //--- Run method for (pointID > 0) -> Update year report
  if (pointID > 0) {

    // Get report params
    reportParams = getParams4PointID(pointID, acmYearTemplateFileName, paramsPath, params);
    // Sort array groupValues descending
    groupValues = orderByItems(groupValues, item => item['!value']['dateTime'], ['desc']);
    if (isDebug && inputArguments) inspector('methodAcmYearReportUpdate.orderByItems.groupValues:', groupValues);

    // Get opcua tags 
    const opcuaTags = isTest() ? getOpcuaConfigOptions(id) : getOpcuaTags();
    const acmTag = opcuaTags.find(t => t.browseName === reportParams.acmTagBrowseName);
    if (!acmTag) {
      logger.error(`RunMetod(methodAcmYearReportUpdate): ${chalk.red('ERROR')}. Tag with browseName "${chalk.cyan(reportParams.acmTagBrowseName)}" not found.`);
      throw new Error(`RunMetod(methodAcmYearReportUpdate): ERROR. Tag with browseName "${reportParams.acmTagBrowseName}" not found.`);
    }
    // Get is test
    const _isTest = reportParams.isTest || isTest() || acmTag.getterParams.isTest;
    reportParams.isTest = _isTest;

    // Get output report path
    const outputReportPath = reportParams.isTest ? reportParams.dataTestPath : reportParams.dataPath;
    makeDirSync([appRoot, outputReportPath]);

    //---------------------------------------------
    // Get begin group value 
    const beginGroupValue = groupValues[0];
    // Get begin report date and year
    beginReportDate = beginGroupValue['!value'].dateTime.split('T')[0];
    beginReportDate = moment.utc(beginReportDate, 'YYYY-MM-DD').add(1, 'years').format('YYYY-MM-DDTHH:mm:ss');
    const rangeYears = getRangeStartEndOfPeriod(beginReportDate, [-5, 'years'], 'years');
    if (isDebug && rangeYears.length) console.log('methodAcmYearReportUpdate.rangeYears:', rangeYears);

    // TimeDuration_start
    timeList.push(moment.utc().format());

    // Run func "updateYearReport" for each year
    for (let index = 0; index < rangeYears.length; index++) {
      const rangeYear = rangeYears[index];
      let rangeGroupValues = groupValues.filter(v => loStartsWith(v['!value'].dateTime, rangeYear));
      if (rangeGroupValues.length) {
        // Sort array groupValues ascending
        rangeGroupValues = orderByItems(rangeGroupValues, item => item['!value']['dateTime'], ['asc']);
        methodResult = await updateYearReport(pointID, reportParams, rangeGroupValues);
        methodResult['params'] = params;
        methodResult['statusCode'] = 'Good';
        methodResults.push(methodResult);

        // TimeDuration_1
        timeList.push(moment.utc().format());
      }
    }

    // TimeDuration_end
    timeList.push(moment.utc().format());

    // CallBack
    if (callback) {
      callMethodResult.outputArguments[0].value = JSON.stringify(methodResults);
      callback(null, callMethodResult);
    } else {
      if (isDebug && timeList.length) inspector('methodAcmYearReportUpdate.timeDurations:', getTimeDurations(timeList));
      if (isDebug && methodResults.length) inspector('methodAcmYearReportUpdate.methodResults:', methodResults);
      return methodResults;
    }
  }

  //--- Run method for (pointID = 0) -> Get array of valid tags 
  if (pointID === 0) {
    // Get array of valid tags 
    const arrayOfValidTags = getRangeArray(4, 1).map(pointID => getParams4PointID(pointID, acmYearTemplateFileName, paramsPath).acmTagBrowseName);
    // CallBack
    if (callback) {
      callMethodResult.outputArguments[0].value = JSON.stringify({ params: { arrayOfValidTags } });
      callback(null, callMethodResult);

    } else {
      const statusCode = 'Good';
      return { statusCode, params: { arrayOfValidTags } };
    }
  }

  //--- Run method for (pointID = -1) -> remove report files
  if (pointID === -1) {
    // Get report params
    reportParams = getParams4PointID(Math.abs(pointID), acmYearTemplateFileName, paramsPath);

    // Get opcua tags 
    const arrayOfValidTags = getRangeArray(4, 1).map(pointID => getParams4PointID(pointID, acmYearTemplateFileName, paramsPath).acmTagBrowseName);
    const opcuaTags = isTest() ? getOpcuaConfigOptions(id) : getOpcuaTags();
    const acmTag = opcuaTags.find(t =>  arrayOfValidTags.includes(t.browseName));
    if (!acmTag) {
      logger.error(`RunMetod(methodAcmYearReportUpdate): ${chalk.red('ERROR')}. Tag with browseName "${chalk.cyan(reportParams.acmTagBrowseName)}" not found.`);
      throw new Error(`RunMetod(methodAcmYearReportUpdate): ERROR. Tag with browseName "${reportParams.acmTagBrowseName}" not found.`);
    }
    // Get is test
    const _isTest = reportParams.isTest || isTest() || acmTag.getterParams.isTest;
    reportParams.isTest = _isTest;

    // Get output report path
    const outputReportPath = reportParams.isTest ? reportParams.dataTestPath : reportParams.dataPath;
    // Remove files from report path
    if (!isUncPath(outputReportPath)) {
      const filePath = toPathWithPosixSep([appRoot, outputReportPath]);
      deletedItems = removeItemsSync([`${filePath}/acmYearReport*.xlsx`], { dryRun: false });
      if (isDebug && deletedItems.length) inspector('removeItemsSync.deletedItems:', deletedItems);
    }

    // CallBack
    if (callback) {
      callMethodResult.outputArguments[0].value = JSON.stringify({ params: { deletedItems } });
      callback(null, callMethodResult);

    } else {
      const statusCode = 'Good';
      return { statusCode, params: { deletedItems } };
    }
  }
}

module.exports = methodAcmYearReportUpdate;
