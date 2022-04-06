/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;

const loForEach = require('lodash/forEach');
const loAt = require('lodash/at');
const loRandom = require('lodash/random');
const loRound = require('lodash/round');

const {
  DataType,
  StatusCodes,
} = require('node-opcua');

const {
  appRoot,
  inspector,
  getPathExtname,
  getPathBasename,
  hexToARGB,
  shiftTimeByOneHour
} = require('../../lib');

const colors = require('../../lib/colors');

const {
  ExceljsHelperClass,
} = require('../../excel-helpers');

const moment = require('moment');

const dataTestPath = '/src/api/opcua/ua-cherkassy-azot_test2/test-data';
let dataPath = '/src/plugins/opcua/opcua-methods/api/method-data';
let paramsPath = '/src/plugins/opcua/opcua-methods/api/method-params';

const isDebug = false;

// Set data cells
const setDataCells = (index, excel) => {
  excel.getCell(`I${index}`).value = 1;
  excel.getCell(`K${index}`).value = loRandom(0, 1);
  let isRun = !!excel.getCell(`K${index}`).value;
  if (isRun) {
    excel.getCell(`E${index}`).value = loRandom(300, 2000);
    excel.getCell(`G${index}`).value = loRandom(30000, 300000);
  } else {
    excel.getCell(`E${index}`).value = 0;
    excel.getCell(`G${index}`).value = 0;
  }
};
// Set date cells
const setDateCells = (index, date, excel) => {
  excel.getCell(`B${index}`).value = moment.utc(shiftTimeByOneHour(date)).format('YYYY-MM');
  excel.getCell(`C${index}`).value = moment.utc(shiftTimeByOneHour(date)).format('YYYY-MM-DD');
  excel.getCell(`D${index}`).value = moment.utc(shiftTimeByOneHour(date)).format('HH:mm');
};
// Set data cells
const setErrDataCells = (index, excel) => {
  excel.getCell(`F${index}`).value = 0;
  excel.getCell(`H${index}`).value = 0;
  excel.getCell(`J${index}`).value = 0;
  excel.getCell(`L${index}`).value = 0;
};

/**
 * Create acm year template
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 */
module.exports = async (inputArguments, context, callback) => {
  let resultPath = '', params = null, paramFullsPath;
  //-----------------------------------
  if (callback) {
    params = JSON.parse(inputArguments[0].value);
  } else {
    let paramsFile = inputArguments[0].value;
    paramFullsPath = [appRoot, paramsPath, paramsFile];
    params = require(join(...paramFullsPath));
  }

  if (params.baseParams) {
    paramFullsPath = [appRoot, paramsPath, params.baseParams];
    const baseParams = require(join(...paramFullsPath));
    params = Object.assign({}, baseParams, params);
  }


  if (isDebug && params) inspector('methodAcmYearTemplateCreate.params:', params);

  // Update colors for params.rulesForCells
  loForEach(params.rulesForCells, function (value, key) {
    loForEach(value, (item) => {
      let argb = '';
      //----------------
      if (item.style.fill) {
        argb = item.style.fill.bgColor.argb;
        argb = loAt(colors, [argb]);
        item.style.fill.bgColor.argb = hexToARGB(argb[0]);
      }
      if (item.style.border) {
        // top
        argb = item.style.border.top.color.argb;
        argb = loAt(colors, [argb]);
        item.style.border.top.color.argb = hexToARGB(argb[0]);
        // left
        argb = item.style.border.left.color.argb;
        argb = loAt(colors, [argb]);
        item.style.border.left.color.argb = hexToARGB(argb[0]);
        // bottom
        argb = item.style.border.bottom.color.argb;
        argb = loAt(colors, [argb]);
        item.style.border.bottom.color.argb = hexToARGB(argb[0]);
        // right
        argb = item.style.border.right.color.argb;
        argb = loAt(colors, [argb]);
        item.style.border.right.color.argb = hexToARGB(argb[0]);
      }
      if (item.style.font) {
        argb = item.style.font.color.argb;
        argb = loAt(colors, [argb]);
        item.style.font.color.argb = hexToARGB(argb[0]);
      }
    });
  });
  if (isDebug && params) inspector('methodAcmYearTemplateCreate.params.rulesForCells:', params.rulesForCells);
  const rulesForCells = params.rulesForCells;

  // Create exceljs object
  let exceljs = new ExceljsHelperClass({
    excelPath: [appRoot, dataPath, params.inputFile],
    sheetName: 'Data_CNBB',// Instructions Data_CNBB Results Test
    bookOptions: {
      fullCalcOnLoad: true
    }
  });

  await exceljs.init();
  let sheetName = exceljs.getSheet().name;
  // Set start row number     
  const startRow = params.startRow;
  // Get current date    
  let currentDate = moment.utc([params.startYear, 0, 1, 0, 0, 0]).format();
  // Set start date cell
  setDateCells(startRow, currentDate, exceljs);

  // Set param data
  exceljs.getCell('H1').value = params.pointID;
  exceljs.getCell('H2').value = params.emissionPointID;
  exceljs.getCell('H3').value = params.pointDescription;
  exceljs.getCell('R2').value = params.qal2СoncentrationMultiplier;
  exceljs.getCell('T2').value = params.qal2VolumeMultiplier;
  exceljs.getCell('R3').value = params.qal2СoncentrationAdition;
  exceljs.getCell('T3').value = params.qal2VolumeAdition;

  // Set data cell
  if (params.isSetData) setDataCells(startRow, exceljs);

  // Get all hours for date range
  const startDate = moment(params.startDate);
  const endDate = moment(params.endDate);
  let hours = endDate.diff(startDate, 'hours');
  let days = endDate.diff(startDate, 'days');
  if (isDebug && hours) console.log('hours:', hours);
  if (isDebug && days) console.log('days:', days);

  // Add rows
  for (let index = startRow; index < hours + startRow - 1; index++) {
    // Add 1 hour and get "nextDate"
    let nextDate = moment.utc(currentDate).add(1, 'hours').format();
    currentDate = nextDate;

    // Duplicate row
    exceljs.duplicateRow(index);

    // Set date cell
    setDateCells(index + 1, currentDate, exceljs);

    // Set shared formulas
    exceljs.getCell(`F${index + 1}`).value = { sharedFormula: `F${startRow}`, result: '' };
    exceljs.getCell(`H${index + 1}`).value = { sharedFormula: `H${startRow}`, result: '' };
    exceljs.getCell(`J${index + 1}`).value = { sharedFormula: `J${startRow}`, result: '' };
    exceljs.getCell(`L${index + 1}`).value = { sharedFormula: `L${startRow}`, result: '' };
    exceljs.getCell(`M${index + 1}`).value = { sharedFormula: `M${startRow}`, result: '' };

    exceljs.getCell(`O${index + 1}`).value = { sharedFormula: `O${startRow}`, result: '' };
    exceljs.getCell(`P${index + 1}`).value = { sharedFormula: `P${startRow}`, result: '' };
    exceljs.getCell(`Q${index + 1}`).value = { sharedFormula: `Q${startRow}`, result: '' };
    exceljs.getCell(`R${index + 1}`).value = { sharedFormula: `R${startRow}`, result: '' };
    exceljs.getCell(`S${index + 1}`).value = { sharedFormula: `S${startRow}`, result: '' };
    exceljs.getCell(`T${index + 1}`).value = { sharedFormula: `T${startRow}`, result: '' };
    exceljs.getCell(`U${index + 1}`).value = { sharedFormula: `U${startRow}`, result: '' };

    // Set data cell 
    if (params.isSetData) {
      setDataCells(index + 1, exceljs);
    } else {
      setErrDataCells(index + 1, exceljs);
    }

  }

  // actualRowCount
  const metrics = exceljs.getSheetMetrics();
  if (isDebug && metrics) inspector('metrics:', metrics);

  // Set conditional formatting for cells
  exceljs.addSheetConditionalFormatting([
    `E${startRow}:E${metrics.rowCount}`,
    `G${startRow}:G${metrics.rowCount}`
  ], rulesForCells.realValue);
  exceljs.addSheetConditionalFormatting([
    `F${startRow}:F${metrics.rowCount}`,
    `H${startRow}:H${metrics.rowCount}`,
    `J${startRow}:J${metrics.rowCount}`,
    `L${startRow}:L${metrics.rowCount}`
  ], rulesForCells.errorSign);
  exceljs.addSheetConditionalFormatting([
    `I${startRow}:I${metrics.rowCount}`,
    `K${startRow}:K${metrics.rowCount}`
  ], rulesForCells.isRun);
  exceljs.addSheetConditionalFormatting([
    `M${startRow}:M${metrics.rowCount}`
  ], rulesForCells.status);
  exceljs.addSheetConditionalFormatting([
    `O${startRow}:O${metrics.rowCount}`,
    `P${startRow}:P${metrics.rowCount}`,
    `Q${startRow}:Q${metrics.rowCount}`,
    `R${startRow}:R${metrics.rowCount}`,
    `S${startRow}:S${metrics.rowCount}`,
    `T${startRow}:T${metrics.rowCount}`,
    `U${startRow}:U${metrics.rowCount}`
  ], rulesForCells.realValue);


  // Write new data to xlsx file
  const ext = getPathExtname(params.outputFile);
  const basename = getPathBasename(params.outputFile, ext);
  const outputFile = `${basename}-${params.startYear}${ext}`;
  if(params.isTest) dataPath = dataTestPath;
  resultPath = await exceljs.writeFile([appRoot, dataPath, outputFile]);

  // CallBack
  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.String,
      value: JSON.stringify({ resultPath, params, hours, days })
    }]
  };
  if (callback) {
    callback(null, callMethodResult);
  } else {
    return { resultPath, params, hours, days };
  }
};
