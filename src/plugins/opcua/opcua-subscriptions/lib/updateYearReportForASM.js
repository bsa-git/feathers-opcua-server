/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;

const {
  appRoot,
  inspector,
  doesFileExist
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
const { filter } = require('compression');

const dataTestPath = '/test/data/tmp/excel-helper';
let dataPath = '/src/api/app/opcua-methods/asm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

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
  let value = dataValue.value.value;
  value = JSON.parse(value);
  if (isLog && value) inspector('saveOpcuaGroupValueToDB.value:', value);
  const reportDate = value['!value'].date;
  const reportYear = reportDate.split('-')[0];

  // Get file name
  let reportFileName = addressSpaceOption.getterParams.toFile;
  reportFileName = loTemplate(reportFileName)({ year: reportYear });

  if (doesFileExist([appRoot, dataPath, reportFileName])) {

    // Get params for year report
    const paramsFile = addressSpaceOption.getterParams.paramsFile;
    paramFullsPath = [appRoot, paramsPath, paramsFile];
    paramsReport = require(join(...paramFullsPath));

    if (paramsReport.baseParams) {
      paramFullsPath = [appRoot, paramsPath, paramsReport.baseParams];
      const baseParams = require(join(...paramFullsPath));
      paramsReport = Object.assign({}, baseParams, paramsReport);
    }

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
    // const dataColumns = paramsReport.dataColumns;

    // actualRowCount
    const metrics = exceljs.getSheetMetrics();
    if (true && metrics) inspector('metrics:', metrics);

    let dateCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dateColumn}${metrics.rowCount}` });
    // let dateCells = exceljs.getCells(sheetName, { range: `${dateColumn}${startRow}:${dateColumn}25` });

    dateCells = dateCells.filter(dateCell => dateCell.value === reportDate);
    
    loForEach(dateCells, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (isLog && cell) inspector(`updateYearReportForASM.cell(${cell.address}):`, cell);
    });

    console.log('dateCells:', dateCells.length, 'dateCells.start:', dateCells[0].address, 'dateCells.end:', dateCells[dateCells.length - 1].address,);
    
  }
}

module.exports = updateYearReportForASM;
