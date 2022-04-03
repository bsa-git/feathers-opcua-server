/* eslint-disable no-unused-vars */
const Path = require('path');
const join = Path.join;
const {
    DataType,
    StatusCodes,
} = require('node-opcua');

const {
    appRoot,
    inspector,
    hexToARGB,
} = require('../../lib');

const colors = require('../../src/plugins/lib/colors');

const {
    ExceljsHelperClass,
} = require('../../src/plugins/excel-helpers');

const moment = require('moment');

const dataPath = '/src/plugins/opcua/opcua-methods/api/data';
let paramsPath = '/src/plugins/opcua/opcua-methods/api/params';

const isLog = false;

/**
 * Create acm year template
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 */
module.exports = async (inputArguments, context, callback) => {
    let resultPath = '';
    //-----------------------------------
    let paramFile = inputArguments[0].value;
    paramsPath = [appRoot, paramsPath, paramFile]
    paramFile = require(join(...paramsPath));
    
    // path = req //join(...path);
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
        excelPath: [appRoot, xlsxFile3],
        sheetName: 'Data_CNBB',// Instructions Data_CNBB Results Test
        bookOptions: {
            fullCalcOnLoad: true
        }
    });

    await exceljs.init();
    let sheetName = exceljs.getSheet().name;
    // Set start row number     
    const startRow = 20;
    // Get current date    
    let currentDate = moment.utc([2022, 0, 1, 0, 0, 0]).format();
    // Set start date cell
    exceljs.getCell(`B${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM');
    exceljs.getCell(`C${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD');
    exceljs.getCell(`D${startRow}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('HH:mm');

    // Set data cell
    exceljs.getCell(`I${startRow}`).value = 1;
    exceljs.getCell(`K${startRow}`).value = loRandom(0, 1);
    let isRun = !!exceljs.getCell(`K${startRow}`).value;
    if (isRun) {
        exceljs.getCell(`E${startRow}`).value = loRandom(300, 2000);
        exceljs.getCell(`G${startRow}`).value = loRandom(30000, 300000);
    } else {
        exceljs.getCell(`E${startRow}`).value = 0;
        exceljs.getCell(`G${startRow}`).value = 0;
    }

    // Get all hours for date range
    const startDate = moment('2022-01-01');
    const endDate = moment('2023-01-01');
    let hours = endDate.diff(startDate, 'hours');
    let days = endDate.diff(startDate, 'days');
    if (true && hours) console.log('hours:', hours);
    if (true && days) console.log('days:', days);

    // Add rows
    for (let index = startRow; index < hours + startRow - 1; index++) {
        // Add 1 hour and get "nextDate"
        let nextDate = moment.utc(currentDate).add(1, 'hours').format();
        currentDate = nextDate;

        // Duplicate row
        exceljs.duplicateRow(index);

        // Set date cell
        exceljs.getCell(`B${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM');
        exceljs.getCell(`C${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('YYYY-MM-DD');
        exceljs.getCell(`D${index + 1}`).value = moment.utc(shiftTimeByOneHour(currentDate)).format('HH:mm');

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
        exceljs.getCell(`I${index + 1}`).value = 1;
        exceljs.getCell(`K${index + 1}`).value = loRandom(0, 1);
        let isRun = !!exceljs.getCell(`K${index + 1}`).value;
        if (isRun) {
            exceljs.getCell(`F${index + 1}`).value = loRandom(0, 1);
            exceljs.getCell(`H${index + 1}`).value = loRandom(0, 1);
            exceljs.getCell(`E${index + 1}`).value = loRandom(300, 2000);
            exceljs.getCell(`G${index + 1}`).value = loRandom(30000, 300000);
        } else {
            exceljs.getCell(`E${index + 1}`).value = 0;
            exceljs.getCell(`G${index + 1}`).value = 0;
        }
    }

    // actualRowCount
    const metrics = exceljs.getSheetMetrics();
    if (true && metrics) inspector('metrics:', metrics);
    assert.ok(true, 'Write data to xlsx file "YearReport2"');

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
    const fileName = getFileName('YearReport2-', 'xlsx', true);
    resultPath = await exceljs.writeFile([appRoot, 'test/data/tmp/excel-helper', fileName]);

    // CallBack
    const callMethodResult = {
        statusCode: StatusCodes.Good,
        outputArguments: [{
            dataType: DataType.String,
            value: 'OK'
        }]
    };
    callback(null, callMethodResult);
};
