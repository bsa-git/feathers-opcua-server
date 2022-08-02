/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const logger = require('../../../../src/logger');

const {
  appRoot,
  inspector,
  isTest,
  doesFileExist,
  makeDirSync,
  getParams4PointID,
  getRangeArray,
  orderByItems,
  cloneObject
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

// Get params path
let paramsPath = '/src/api/app/opcua-methods/acm-reports';

const {
  acmYearTemplateFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

// Get test ID
const id = 'ua-cherkassy-azot_test2';

/**
 * Update acm year report
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {void|Object}
 */
async function methodAcmYearReportUpdate(inputArguments, context, callback) {
  let reportFile, reportParams = null, paramFullsPath, resultPath;
  let dateCells, dateCells4Rows, dateCells4Date, reportDates = [];
  let beginReportDate, beginReportYear;
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

  
  const pointID = params.pointID;

  if (pointID > 0) {
    // Get report params
    reportParams = getParams4PointID(pointID, acmYearTemplateFileName, paramsPath, params);
    // Sort array groupValues descending
    groupValues = orderByItems(groupValues, item => item['!value']['dateTime'], ['desc']);
    if (isDebug && inputArguments) inspector('methodAcmYearReportUpdate.orderByItems.groupValues:', groupValues);

    // Get begin group value 
    const beginGroupValue = groupValues[0];
    // Get begin report date and year
    beginReportDate = beginGroupValue['!value'].dateTime.split('T')[0];
    beginReportYear = beginReportDate.split('-')[0];

    try {
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

      // Get year report file
      const outputReportPath = isTest() ? reportParams.dataTestPath : reportParams.isTest ? reportParams.dataTestPath : reportParams.dataPath;
      makeDirSync([appRoot, outputReportPath]);
      const outputReportFile = loTemplate(reportParams.outputReportFile)({ pointID, year: beginReportYear });
      reportFile = [appRoot, outputReportPath, outputReportFile];

      if (!doesFileExist(reportFile)) {
        const outputTemplateFile = loTemplate(reportParams.outputTemplateFile)({ pointID, year: beginReportYear });
        reportFile = [appRoot, outputReportPath, outputTemplateFile];
      }
      reportFile = join(...reportFile);

      if (!doesFileExist(reportFile)) {
        logger.error(`There is no file "${chalk.cyan(reportFile)}" for the reporting period on the automated monitoring system.`);
        new Error(`There is no file "${reportFile}" for the reporting period on the automated monitoring system.`);
      }

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

      // Get actual row count
      const metrics = exceljs.getSheetMetrics();
      if (isDebug && metrics) inspector('metrics:', metrics);
      // Get cells for report date
      dateCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dateColumn}${metrics.rowCount}` });

      for (let index = 0; index < groupValues.length; index++) {
        const groupValue = groupValues[index];
        // Get report date and year
        const reportDate = groupValue['!value'].dateTime.split('T')[0];
        const reportYear = reportDate.split('-')[0];

        // We will work with the report only for one specific year -> beginReportYear
        if (reportYear !== beginReportYear) {
          continue;
        }

        reportDates.push(reportDate);

        dateCells4Date = dateCells.filter(dateCell => dateCell.value === reportDate);
        // We will work with the report only for dateCells4Date.length > 0
        if (!dateCells4Date.length) {
          continue;
        }

        // Show cells
        loForEach(dateCells4Date, function (cell) {
          cell = loOmit(cell, ['cell', 'column', 'row']);
          if (isDebug && cell) inspector(`ch_m5UpdateAcmYearReport.cell(${cell.address}):`, cell);
        });
        // Get start/end row for report date  
        const startRow4Date = dateCells4Date[0]['address2'].row;
        const endRow4Date = dateCells4Date[dateCells4Date.length - 1]['address2'].row;
        // Set cell value to groupValue
        loForEach(reportParams.dataColumns, function (column, alias) {
          dateCells4Rows = exceljs.getCells(sheetName, { range: `${column}${startRow4Date}:${column}${endRow4Date}` });
          loForEach(groupValue, function (items, tag) {
            let tagAlias = tag.split(':');
            tagAlias = tagAlias[tagAlias.length - 1];
            if ((tagAlias === alias) && (dateCells4Rows.length === items.length)) {
              for (let index2 = 0; index2 < items.length; index2++) {
                const item = items[index2];
                dateCells4Rows[index2].cell.value = item;
                dateCells4Rows[index2].value = item;
              }
            }
          });
          // Set values for 'CHBB'
          if (alias.includes('CHBB')) {
            for (let index3 = 0; index3 < dateCells4Rows.length; index3++) {
              const dateCell = dateCells4Rows[index3];
              dateCell.cell.value = 1;
              dateCell.value = 1;
            }
          }
        });
      }

      // Write report file
      resultPath = await exceljs.writeFile([appRoot, outputReportPath, outputReportFile]);
      if (isDebug && resultPath) console.log(
        chalk.green('Update asm year report - OK!'),
        'reportDates:', chalk.cyan(reportDates.length),
        'resultFile:', chalk.cyan(outputReportFile)
      );

    } catch (error) {
      logger.error(`Excel file initialization error: reportFile = "${chalk.cyan(reportFile)}"; error.message = "${chalk.cyan(error.message)}"`);
      throw error;
    }

    // CallBack
    if (callback) {
      callMethodResult.outputArguments[0].value = JSON.stringify({ resultPath, params, reportYear: beginReportYear, reportDates });
      callback(null, callMethodResult);
    } else {
      const statusCode = 'Good';
      return { statusCode, resultPath, params, reportYear: beginReportYear, reportDates };
    }
  } else {

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
}

module.exports = methodAcmYearReportUpdate;
