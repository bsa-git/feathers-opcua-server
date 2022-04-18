/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const {
  appRoot,
  inspector,
} = require('../src/plugins/lib');

const {
  methodAcmYearTemplateCreate
} = require('../src/plugins/opcua/opcua-methods');

const {
  ExceljsHelperClass,
} = require('../src/plugins/excel-helpers');



const debug = require('debug')('app:#4-scriptAcmYearTemplateCreate');
const isDebug = false;


// Get argv
// e.g. argv.script='updateAddressSpaceOptions' =>  Update AddressSpaceOptions.json
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#4');

describe('<<=== ScriptOperations: (#4-scriptAcmYearTemplateCreate) ===>>', () => {

  if (!isScript) return;

  it('#4: ScriptOperations: create acm year template xlsx file', async () => {
    const result = await methodAcmYearTemplateCreate([{ value: argv.params }]);
    assert.ok(result, '#4-scriptAcmYearTemplateCreate');
    if (result) {

      const resultPath = result.resultPath;
      const params = result.params;

      if (isDebug && resultPath) debug('resultPath:', resultPath);
      if (isDebug && params) inspector('#4-scriptAcmYearTemplateCreate.params:', params);

      // Create exceljs object
      const exceljs = new ExceljsHelperClass({
        excelPath: resultPath,
        sheetName: 'Data_CNBB'
      });

      await exceljs.init();
      const sheetName = exceljs.getSheet().name;

      if (true && result.hours) console.log('hours:', result.hours);
      if (true && result.days) console.log('days:', result.days);
      const metrics = exceljs.getSheetMetrics();
      if (true && metrics) inspector('metrics:', metrics);


      const resultItems = exceljs.getCells(sheetName, { range: `B${params.startRow}:B${metrics.rowCount}` });
      // const actualRows = metrics.actualRowCount - startRow + 1;
      assert.ok(result.hours === resultItems.length, `Write data to xlsx file "${params.outputTemplateFile}": ${result.hours} = ${resultItems.length}`);
    }

  });
});
