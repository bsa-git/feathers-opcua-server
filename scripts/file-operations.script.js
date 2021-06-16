/* eslint-disable no-unused-vars */
const assert = require('assert');
const { appRoot, inspector } = require('../src/plugins/lib');

const {
  writeFileSync,
  writeJsonFileSync,
  readFileSync,
} = require('../src/plugins/lib/file-operations');

const chalk = require('chalk');
const papa = require('papaparse');

const debug = require('debug')('app:file-operations.script');
const isDebug = false;
const isLog = false;

// Matching fields for KEPServer
const kepServerTags = {
  column1: { kepSrvField: 'Tag Name', myField: 'TAG', default: undefined },
  column2: { kepSrvField: 'Address', myField: ['Compnd', 'TAG'], default: undefined },
  column3: { kepSrvField: 'Data Type', myField: '', default: 'Default' },
  column4: { kepSrvField: 'Respect Data Type', myField: '', default: 1 },
  column5: { kepSrvField: 'Client Access', myField: '', default: 'RO' },
  column6: { kepSrvField: 'Scan Rate', myField: '', default: 100 },
  column7: { kepSrvField: 'Scaling', myField: '', default: undefined },
  column8: { kepSrvField: 'Raw Low', myField: '', default: undefined },
  column9: { kepSrvField: 'Raw High', myField: '', default: undefined },
  column10: { kepSrvField: 'Scaled Low', myField: 'Lsco1', default: undefined },
  column11: { kepSrvField: 'Scaled High', myField: 'Hsco1', default: undefined },
  column12: { kepSrvField: 'Scaled Data Type', myField: '', default: undefined },
  column13: { kepSrvField: 'Clamp Low', myField: '', default: undefined },
  column14: { kepSrvField: 'Clamp High', myField: '', default: undefined },
  column15: { kepSrvField: 'Eng Units', myField: 'Eng', default: undefined },
  column16: { kepSrvField: 'Description', myField: ['Descr1', 'Descr2'], default: undefined },
  column17: { kepSrvField: 'Negate Value', myField: '', default: undefined },
};

// Script Execution
const scriptExecution = {
  updateAddressSpaceOptions: false,
  converterForKEPServer: true
};

// Is run scripts
const isRunScripts = () => {
  let result = false;
  Object.keys(scriptExecution).forEach(key => {
    if (scriptExecution[key]) {
      result = true;
    }
  });
  return result;
};

describe('<<=== ScriptOperations: (file-operations.script) ===>>', () => {
  
  if (!isRunScripts()) return;

  if (scriptExecution.updateAddressSpaceOptions) {
    it('#1 FileOperations: update AddressSpaceOptions.json', () => {
      let path = 'src/api/opcua/ua-cherkassy-azot-m5/AddressSpaceOptions.json';
      let options = readFileSync([appRoot, path]);
      options = JSON.parse(options);
      options.groups = options.groups.map(item => {
        if (item.browseName) {
          item.description = item.displayName;
          item.displayName = item.aliasName;
        }
        return item;
      });
      writeFileSync([appRoot, path], options, true);
      assert.ok(true, 'update AddressSpaceOptions.json');
    });
  }

  if (scriptExecution.converterForKEPServer) {
    it('#2 ScriptOperations: Converter for KEPServer', () => {
      try {
        let path = 'scripts/tmp/KEPServer';
        let fileName = 'm52_v210616_1.csv';
        // Read file
        let data = readFileSync([appRoot, path, fileName]);
        data = papa.parse(data, { delimiter: ';', header: true });
        if (isLog) inspector('Converter for KEPServer.jsonData[0]:', data.data[0]);
        if (isLog) inspector('Converter for KEPServer.meta:', data.meta);
        // Get data
        data = data.data;
        // Write data json file
        fileName = 'm52_v210616_1.json';
        writeJsonFileSync([appRoot, path, fileName], data);

        /**
        column1: { kepSrvField: 'Tag Name', myField: 'TAG', default: undefined },
        column2: { kepSrvField: 'Address', myField: ['Compnd', 'TAG'], default: undefined },
        column3: { kepSrvField: 'Data Type', myField: '', default: 'Default' },
        column4: { kepSrvField: 'Respect Data Type', myField: '', default: 1 },
        column5: { kepSrvField: 'Client Access', myField: '', default: 'RO' },
        column6: { kepSrvField: 'Scan Rate', myField: '', default: 100 },
        column7: { kepSrvField: 'Scaling', myField: '', default: undefined },
        column8: { kepSrvField: 'Raw Low', myField: '', default: undefined },
        column9: { kepSrvField: 'Raw High', myField: '', default: undefined },
        column10: { kepSrvField: 'Scaled Low', myField: 'Lsco1', default: undefined },
        column11: { kepSrvField: 'Scaled High', myField: 'Hsco1', default: undefined },
        column12: { kepSrvField: 'Scaled Data Type', myField: '', default: undefined },
        column13: { kepSrvField: 'Clamp Low', myField: '', default: undefined },
        column14: { kepSrvField: 'Clamp High', myField: '', default: undefined },
        column15: { kepSrvField: 'Eng Units', myField: 'Eng', default: undefined },
        column16: { kepSrvField: 'Description', myField: ['Descr1', 'Descr2'], default: undefined },
        column17: { kepSrvField: 'Negate Value', myField: '', default: undefined }, 
         */
        data = data.map(item => {
          let result = {};
          result[kepServerTags.column1.kepSrvField] = item[kepServerTags.column1.myField];
          result[kepServerTags.column2.kepSrvField] = `52AW00/${item[kepServerTags.column2.myField[0]]}:${item[kepServerTags.column2.myField[1]]}.PNT\\hist00`;
          result[kepServerTags.column3.kepSrvField] = item[kepServerTags.column3.default];
          result[kepServerTags.column4.kepSrvField] = item[kepServerTags.column4.default];
          result[kepServerTags.column5.kepSrvField] = item[kepServerTags.column5.default];
          result[kepServerTags.column6.kepSrvField] = item[kepServerTags.column6.default];
          result[kepServerTags.column7.kepSrvField] = item[kepServerTags.column7.default];
          result[kepServerTags.column8.kepSrvField] = item[kepServerTags.column8.default];
          result[kepServerTags.column9.kepSrvField] = item[kepServerTags.column9.default];
          result[kepServerTags.column10.kepSrvField] = item[kepServerTags.column10.myField];
          result[kepServerTags.column11.kepSrvField] = item[kepServerTags.column11.myField];
          result[kepServerTags.column12.kepSrvField] = item[kepServerTags.column12.default];
          result[kepServerTags.column13.kepSrvField] = item[kepServerTags.column13.default];
          result[kepServerTags.column14.kepSrvField] = item[kepServerTags.column14.default];
          result[kepServerTags.column15.kepSrvField] = item[kepServerTags.column15.myField];
          result[kepServerTags.column16.kepSrvField] = `${item[kepServerTags.column16.myField[0]]} ${item[kepServerTags.column16.myField[1]]}`;
          result[kepServerTags.column17.kepSrvField] = item[kepServerTags.column17.default];
          return result;
        });

        // Write tags csv file
        let csv = papa.unparse(data, { delimiter: ',' });
        fileName = 'm52-kepServer_v210616_1.csv';
        writeFileSync([appRoot, path, fileName], csv);
        assert.ok(true, 'ScriptOperations: Convert m52baza.csv to m52ImportTags.csv for KEPServer');
      } catch (error) {
        inspector('Converter for KEPServer.error:', error);
        assert.ok(false, 'ScriptOperations: Convert m52baza.csv to m52ImportTags.csv for KEPServer');
      }
    });
  }
});
