/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const logger = require('../../../../logger');

const {
  appRoot,
  inspector,
  doesFileExist,
  makeDirSync
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  ExceljsHelperClass,
} = require('../../../excel-helpers');

const moment = require('moment');

const loForEach = require('lodash/forEach');
const loTemplate = require('lodash/template');
const loOmit = require('lodash/omit');

const dataTestPath = '/test/data/tmp/excel-helper';
let dataPath = '/src/api/app/opcua-methods/asm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

makeDirSync([appRoot, dataTestPath]);

const {
  paramsFileName,
} = require(join(...[appRoot, paramsPath]));

const isLog = false;

/**
 * @method updateYearReportForASM
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function updateYearReportForASM(params, dataValue) {
  let resultPath = '', paramsReport = null, paramFullsPath;
  //-----------------------------------

  if (isLog && params) inspector('updateYearReportForASM.params:', params);
  if (isLog && dataValue) inspector('updateYearReportForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;
  if (isLog && addressSpaceOption) inspector('updateYearReportForASM.addressSpaceOption:', addressSpaceOption);

  // Get group value
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('saveOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let groupValue = dataValue.value.value;
  groupValue = JSON.parse(groupValue);
  if (isLog && groupValue) inspector('saveOpcuaGroupValueToDB.value:', groupValue);
  const reportDate = groupValue['!value'].date;
  const reportYear = reportDate.split('-')[0];

  // Get params for year report
  const pointID = addressSpaceOption.getterParams.pointID;
  const paramsFile = loTemplate(paramsFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  paramsReport = require(join(...paramFullsPath));

  if (paramsReport.baseParams) {
    const baseParamsFile = loTemplate(paramsFileName)({ pointID: paramsReport.baseParams });
    paramFullsPath = [appRoot, paramsPath, baseParamsFile];
    const baseParams = require(join(...paramFullsPath));
    paramsReport = Object.assign({}, baseParams, paramsReport);
  }

  // Get report file name
  const reportFileName = loTemplate(paramsReport.outputTemplateFile)({ pointID, year: reportYear });

  if (doesFileExist([appRoot, dataPath, reportFileName])) {
    
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, dataPath, reportFileName],
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
    if (isLog && metrics) inspector('metrics:', metrics);
    // Get cells for report date
    let dateCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dateColumn}${metrics.rowCount}` });
    dateCells = dateCells.filter(dateCell => dateCell.value === reportDate);
    // Show cells
    loForEach(dateCells, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (isLog && cell) inspector(`updateYearReportForASM.cell(${cell.address}):`, cell);
    });
    // Get start/end row for report date  
    const startRow4Date = dateCells[0]['address2'].row;
    const endRow4Date = dateCells[dateCells.length - 1]['address2'].row;
    // Set cell value to groupValue
    loForEach(paramsReport.dataColumns, function (column, alias) {
      dateCells = exceljs.getCells(sheetName, { range: `${column}${startRow4Date}:${column}${endRow4Date}` });
      console.log('dateCells:', dateCells.length, 'startRow4Date:', startRow4Date, 'endRow4Date:', endRow4Date, 'alias:', alias);
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
      // Show cells
      // loForEach(dateCells, function (cell) {
      //   cell = loOmit(cell, ['cell', 'column', 'row']);
      //   if (true && column === 'G') inspector(`updateYearReportForASM.cell(${cell.address}):`, cell);
      // });
    });

    // Write report file
    const outputReportFile = loTemplate(paramsReport.outputReportFile)({ pointID, year: reportYear });
    const resultPath = await exceljs.writeFile([appRoot, dataTestPath, outputReportFile]);
    if (true && resultPath) inspector('updateYearReportForASM.resultPath:', resultPath);

  } else {
    logger.error(`There is no file "${reportFileName}" for the reporting period on the automated monitoring system.`);
  }
}

module.exports = updateYearReportForASM;
