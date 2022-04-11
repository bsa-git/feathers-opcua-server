/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  appRoot,
  inspector,
  strReplace,
  getFloat
} = require('../src/plugins/lib');

const {
  writeFileSync,
  writeJsonFileSync,
  readFileSync,
  doesFileExist,
  removeFileSync
} = require('../src/plugins/lib/file-operations');

const chalk = require('chalk');
const papa = require('papaparse');

const debug = require('debug')('app:file-operations.script');
const isDebug = false;
const isLog = false;

// Get argv
// e.g. argv.script='updateAddressSpaceOptions' =>  Update AddressSpaceOptions.json
// e.g. argv.script='converterCsvForKEPServer' =>  Converter from `Fox` excel data `.csv` file to KEPServer
// e.g. argv.script='converterInpForKEPServer' =>  Converter from `Fox` hist data `.inp` file to KEPServer
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#2');

// Config for converter from `Fox` excel data `.csv` file to KEPServer
const csvKepServerConfig = {
  fields: {
    column1: { fromField: 'TAG', toField: 'Tag Name', default: undefined },
    column2: { fromField: ['Compnd', 'TAG'], toField: 'Address', default: undefined },
    column3: { fromField: '', toField: 'Data Type', default: 'Default' },
    column4: { fromField: '', toField: 'Respect Data Type', default: 1 },
    column5: { fromField: '', toField: 'Client Access', default: 'R' },
    column6: { fromField: '', toField: 'Scan Rate', default: 1000 },
    column7: { fromField: '', toField: 'Scaling', default: undefined },
    column8: { fromField: '', toField: 'Raw Low', default: undefined },
    column9: { fromField: '', toField: 'Raw High', default: undefined },
    column10: { fromField: 'Lsco1', toField: 'Scaled Low', default: undefined },
    column11: { fromField: 'Hsco1', toField: 'Scaled High', default: undefined },
    column12: { fromField: '', toField: 'Scaled Data Type', default: undefined },
    column13: { fromField: '', toField: 'Clamp Low', default: undefined },
    column14: { fromField: '', toField: 'Clamp High', default: undefined },
    column15: { fromField: 'Eng', toField: 'Eng Units', default: undefined },
    column16: { fromField: ['Descr1', 'Descr2'], toField: 'Description', default: undefined },
    column17: { fromField: '', toField: 'Negate Value', default: undefined },
  },
  filter: ['AI', 'AIs', 'AO'],
  delimiterFrom: ';',
  delimiterTo: ',',
  path: 'src/app/scripts/toKEPServer/fromFoxExcel',
  jsonFileName: 'm52_v210616.json',
  csvFileNameFrom: 'm52_v210616.csv',
  csvFileNameTo: 'm52-kepServer_v210616.csv',
};

describe('<<=== ScriptOperations: (#2-converterCsvForKEPServer) ===>>', () => {

  if (!isScript) return;
  // Converter from Fox Excel data `.csv` file to KEPServer
  it('#2: ScriptOperations: Converter csv files for KEPServer', () => {
    try {
      const config = csvKepServerConfig;
      let path = config.path;
      let fileName = config.csvFileNameFrom;
      // Read file
      let data = readFileSync([appRoot, path, fileName]);
      data = papa.parse(data, { delimiter: config.delimiterFrom, header: true });
      if (isLog) inspector('Converter for KEPServer.jsonData[0]:', data.data[0]);
      if (isLog) inspector('Converter for KEPServer.meta:', data.meta);
      // Get data
      data = data.data;
      if (isDebug) debug('Amount of data before filtering:', data.length);
      // Filter data 
      data = data.filter(item => config.filter.includes(item.Type_tag));
      if (isDebug) debug('Amount of data after filtering:', data.length);
      // Write data to json file
      fileName = config.jsonFileName;
      writeJsonFileSync([appRoot, path, fileName], data);

      // Convert data
      const fields = config.fields;
      data = data.map(item => {
        let result = {};
        result[fields.column1.toField] = item[fields.column1.fromField];
        result[fields.column2.toField] = `52AW00/${item[fields.column2.fromField[0]]}:${item[fields.column2.fromField[1]]}.PNT\\hist00`;
        result[fields.column3.toField] = item[fields.column3.default];
        result[fields.column4.toField] = item[fields.column4.default];
        result[fields.column5.toField] = item[fields.column5.default];
        result[fields.column6.toField] = item[fields.column6.default];
        result[fields.column7.toField] = item[fields.column7.default];
        result[fields.column8.toField] = item[fields.column8.default];
        result[fields.column9.toField] = item[fields.column9.default];
        result[fields.column10.toField] = item[fields.column10.fromField];
        result[fields.column11.toField] = item[fields.column11.fromField];
        result[fields.column12.toField] = item[fields.column12.default];
        result[fields.column13.toField] = item[fields.column13.default];
        result[fields.column14.toField] = item[fields.column14.default];
        result[fields.column15.toField] = item[fields.column15.fromField];
        result[fields.column16.toField] = `${item[fields.column16.fromField[0]]} ${item[fields.column16.fromField[1]]}`;
        result[fields.column17.toField] = item[fields.column17.default];
        return result;
      });

      // Write data to csv file
      let csv = papa.unparse(data, { delimiter: config.delimiterTo });
      fileName = config.csvFileNameTo;
      writeFileSync([appRoot, path, fileName], csv);
      assert.ok(true, 'ScriptOperations: Converter for KEPServer');
    } catch (error) {
      inspector('#2: ScriptOperations: Converter csv files for KEPServer:', error.message);
      assert.ok(false, '#2: ScriptOperations: Converter csv files for KEPServer');
    }
  });
});
