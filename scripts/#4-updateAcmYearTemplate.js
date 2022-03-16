/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');

const {
  appRoot,
  inspector,
} = require('../src/plugins/lib');

const {
  writeFileSync,
  writeJsonFileSync,
  readFileSync,
  doesFileExist,
  removeFileSync
} = require('../src/plugins/lib/file-operations');

const {
  ExceljsHelperClass,
} = require('../src/plugins/excel-helpers');

const chalk = require('chalk');
const papa = require('papaparse');

const debug = require('debug')('app:file-operations.script');
const isDebug = false;
const isLog = false;

// Get argv
// e.g. argv.script='updateAddressSpaceOptions' =>  Update AddressSpaceOptions.json
const argv = yargs(hideBin(process.argv)).argv;
if(isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#4');

const xlsxFile = '/scripts/api/excel-templates/acm-reports/acmYearTemplate.xlsx';


describe('<<=== ScriptOperations: (#4-updateAcmYearTemplate) ===>>', () => {

  if(!isScript) return;
  // Update AddressSpaceOptions.json
  it('#4: ScriptOperations: update acm year template xlsx file', async () => {
    // Create exceljs object
    let exceljs = new ExceljsHelperClass({
      excelPath: [appRoot, xlsxFile],
      sheetName: 'Data_CNBB'
    });
  
    await exceljs.init();
    const sheetName = exceljs.getSheet().name;
    const cells = exceljs.getCells(sheetName, { range: 'A6:A6' });
    assert.ok(cells.length, 'Get cells from xlsx file');
  
    loForEach(cells, function (cell) {
      cell = loOmit(cell, ['cell', 'column', 'row']);
      if (true && cell) inspector(`#4: Update acm year template xlsx file.cell(${cell.address}):`, cell);
    });
  });
});
