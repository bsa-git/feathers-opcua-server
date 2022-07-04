/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const chalk = require('chalk');
const logger = require('../../../../src/logger');

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
  let reportFile, paramsReport = null, paramFullsPath, resultPath;
  //---------------------------------------------------------------

  if (isDebug && inputArguments.length) inspector('methodAcmYearReportUpdate.inputArguments:', inputArguments);

  // Get params and group value
  if (!callback) {
    inputArguments = inputArguments[0];
  }
  const params = JSON.parse(inputArguments[0].value);
  const groupValue = JSON.parse(inputArguments[1].value);

  if (isDebug && params) inspector('methodAcmYearReportUpdate.params:', params);
  if (isDebug && groupValue) inspector('methodAcmYearReportUpdate.dataValue:', groupValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Get report date and year
  const reportDate = groupValue['!value'].dateTime.split('T')[0];
  const reportYear = reportDate.split('-')[0];

  // Get params for year report
  const pointID = addressSpaceOption.getterParams.pointID;
  const paramsFile = loTemplate(acmYearTemplateFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  paramsReport = require(join(...paramFullsPath));

  if (paramsReport.baseParams) {
    const baseParamsFile = loTemplate(acmYearTemplateFileName)({ pointID: paramsReport.baseParams });
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    const baseParams = require(join(...paramFullsPath));
    paramsReport = Object.assign({}, baseParams, paramsReport);
  }

  // Get year report file
  const outputReportPath = addressSpaceOption.getterParams.toPath;
  makeDirSync([appRoot, outputReportPath]);
  const outputReportFile = loTemplate(paramsReport.outputReportFile)({ pointID, year: reportYear });
  reportFile = [appRoot, outputReportPath, outputReportFile];
  if (!doesFileExist(reportFile)) {
    const outputTemplateFile = loTemplate(paramsReport.outputTemplateFile)({ pointID, year: reportYear });
    reportFile = [appRoot, dataPath, outputTemplateFile];
  }

  if (doesFileExist(reportFile)) {
    try {
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
      const startRow = paramsReport.startRow;
      const dateColumn = paramsReport.dateColumn;

      // Get actual row count
      const metrics = exceljs.getSheetMetrics();
      if (isDebug && metrics) inspector('metrics:', metrics);
      // Get cells for report date
      let dateCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dateColumn}${metrics.rowCount}` });
      dateCells = dateCells.filter(dateCell => dateCell.value === reportDate);
      // Show cells
      loForEach(dateCells, function (cell) {
        cell = loOmit(cell, ['cell', 'column', 'row']);
        if (isDebug && cell) inspector(`ch_m5UpdateAcmYearReport.cell(${cell.address}):`, cell);
      });
      // Get start/end row for report date  
      const startRow4Date = dateCells[0]['address2'].row;
      const endRow4Date = dateCells[dateCells.length - 1]['address2'].row;
      // Set cell value to groupValue
      loForEach(paramsReport.dataColumns, function (column, alias) {
        dateCells = exceljs.getCells(sheetName, { range: `${column}${startRow4Date}:${column}${endRow4Date}` });
        loForEach(groupValue, function (items, tag) {
          let tagAlias = tag.split(':');
          tagAlias = tagAlias[tagAlias.length - 1];
          if ((tagAlias === alias) && (dateCells.length === items.length)) {
            for (let index = 0; index < items.length; index++) {
              const item = items[index];
              dateCells[index].cell.value = item;
              dateCells[index].value = item;
            }
          }
        });
        // Set values for 'CHBB'
        if (alias.includes('CHBB')) {
          for (let index = 0; index < dateCells.length; index++) {
            const dateCell = dateCells[index];
            dateCell.cell.value = 1;
            dateCell.value = 1;
          }
        }
      });

      // Write report file
      resultPath = await exceljs.writeFile([appRoot, outputReportPath, outputReportFile]);
      if (isDebug && resultPath) console.log(
        chalk.green('Update asm year report - OK!'),
        'reportDate:', chalk.cyan(reportDate),
        'resultFile:', chalk.cyan(outputReportFile)
      );

    } catch (error) {
      reportFile = join(...reportFile);
      logger.error(`Excel file initialization error: reportFile = "${chalk.cyan(reportFile)}"; error.message = "${chalk.cyan(error.message)}"`);
      throw error;
    }
  } else {
    logger.error(`There is no file "${chalk.cyan(reportFile[2])}" for the reporting period on the automated monitoring system.`);
  }

  // CallBack
  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: JSON.stringify({ resultPath, params, reportDate })
    }]
  };
  if (callback) {
    callback(null, callMethodResult);
  } else {
    const statusCode = 'Good';
    return { statusCode, resultPath, params, reportDate };
  }
}

module.exports = methodAcmYearReportUpdate;
