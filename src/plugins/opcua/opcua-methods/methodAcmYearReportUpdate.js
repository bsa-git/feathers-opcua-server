/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const logger = require('../../../../src/logger');

const {
  appRoot,
  inspector,
  doesFileExist,
  makeDirSync,
  sortByStringField
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

let dataPath = '/src/api/app/opcua-methods/acm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/acm-reports/params';

const {
  acmYearTemplateFileName,
} = require(join(...[appRoot, paramsPath]));

const isDebug = false;

/**
 * Update acm year report
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {void|Object}
 */
async function methodAcmYearReportUpdate(inputArguments, context, callback) {
  let reportFile, reportParams = null, paramFullsPath, resultPath;
  let errorMessage, dateCells, dateCells4Rows, dateCells4Date, reportDates = [];
  let beginReportDate, beginReportYear;
  //---------------------------------------------------------------

  if (isDebug && inputArguments.length) inspector('methodAcmYearReportUpdate.inputArguments:', inputArguments);

  // Get params and group value
  if (!callback) {
    inputArguments = inputArguments[0];
  }
  const params = JSON.parse(inputArguments[0].value);
  let groupValues = JSON.parse(inputArguments[1].value);
  if (!Array.isArray(groupValues)) {
    groupValues = [groupValues];
  }

  // Sort array groupValues descending
  groupValues = sortByStringField(groupValues, '!value', false);

  // Get begin group value 
  const beginGroupValue = groupValues[0];

  if (isDebug && params) inspector('methodAcmYearReportUpdate.params:', params);
  if (isDebug && groupValues.length) inspector('methodAcmYearReportUpdate.groupValues:', groupValues);

  try {

    const addressSpaceOption = params.addressSpaceOption;

    // Get params for year report
    const pointID = addressSpaceOption.getterParams.pointID;
    const paramsFile = loTemplate(acmYearTemplateFileName)({ pointID });
    paramFullsPath = [appRoot, paramsPath, paramsFile];
    reportParams = require(join(...paramFullsPath));

    if (reportParams.baseParams) {
      const baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: reportParams.baseParams });
      paramFullsPath = [appRoot, paramsPath, baseParamsFile];
      const baseParams = require(join(...paramFullsPath));
      reportParams = Object.assign({}, baseParams, reportParams);
    }
    // Get begin report date and year
    beginReportDate = beginGroupValue['!value'].dateTime.split('T')[0];
    beginReportYear = beginReportDate.split('-')[0];

    // Get year report file
    const outputReportPath = addressSpaceOption.getterParams.toPath;
    makeDirSync([appRoot, outputReportPath]);
    const outputReportFile = loTemplate(reportParams.outputReportFile)({ pointID, year: beginReportYear });
    reportFile = [appRoot, outputReportPath, outputReportFile];
    if (!doesFileExist(reportFile)) {
      const outputTemplateFile = loTemplate(reportParams.outputTemplateFile)({ pointID, year: beginReportYear });
      reportFile = [appRoot, dataPath, outputTemplateFile];
    }

    if (!doesFileExist(reportFile)) {
      errorMessage = `There is no file "${chalk.cyan(reportFile[2])}" for the reporting period on the automated monitoring system.`;
      logger.error(errorMessage);
      new Error(errorMessage);
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
      if(reportYear !== beginReportYear){
        continue;
      }
      
      reportDates.push(reportDate);
      
      dateCells4Date = dateCells.filter(dateCell => dateCell.value === reportDate);
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
    reportFile = join(...reportFile);
    logger.error(`Excel file initialization error: reportFile = "${chalk.cyan(reportFile)}"; error.message = "${chalk.cyan(error.message)}"`);
    throw error;
  }

  // CallBack
  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: JSON.stringify({ resultPath, params, reportYear: beginReportYear, reportDates })
    }]
  };
  if (callback) {
    callback(null, callMethodResult);
  } else {
    const statusCode = 'Good';
    return { statusCode, resultPath, params, reportYear: beginReportYear, reportDates };
  }
}

module.exports = methodAcmYearReportUpdate;
