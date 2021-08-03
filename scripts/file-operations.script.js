/* eslint-disable no-unused-vars */
const assert = require('assert');
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
const isDebug = true;
const isLog = false;

// Script Execution
const scriptExecution = {
  // Update AddressSpaceOptions.json
  updateAddressSpaceOptions: false,
  // Converter from `Fox` excel data `.csv` file to KEPServer
  converterCsvForKEPServer: false,
  // Converter from `Fox` hist data `.inp` file to KEPServer
  converterInpForKEPServer: true
};

// Config for converter from `Fox` excel data `.csv` file to KEPServer
const csvKepServerConfig = {
  fields: {
    column1: { fromField: 'TAG', toField: 'Tag Name', default: undefined },
    column2: { fromField: ['Compnd', 'TAG'], toField: 'Address', default: undefined },
    column3: { fromField: '', toField: 'Data Type', default: 'Default' },
    column4: { fromField: '', toField: 'Respect Data Type', default: 1 },
    column5: { fromField: '', toField: 'Client Access', default: 'RO' },
    column6: { fromField: '', toField: 'Scan Rate', default: 100 },
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
  path: 'scripts/api/toKEPServer/fromFoxExcel',
  jsonFileName: 'm52_v210616.json',
  csvFileNameFrom: 'm52_v210616.csv',
  csvFileNameTo: 'm52-kepServer_v210616.csv',
};

// Config for converter from `Fox` hist data `.inp` file to KEPServer
const inpKepServerConfig = {
  fields: {
    column1: { fromField: 'NAMEINCOL', toField: 'Tag Name', default: undefined },
    column2: { fromField: ['NAMEINCOL'], toField: 'Address', default: undefined },
    column3: { fromField: '', toField: 'Data Type', default: 'Default' },
    column4: { fromField: '', toField: 'Respect Data Type', default: 1 },
    column5: { fromField: '', toField: 'Client Access', default: 'RO' },
    column6: { fromField: '', toField: 'Scan Rate', default: 100 },
    column7: { fromField: '', toField: 'Scaling', default: undefined },
    column8: { fromField: '', toField: 'Raw Low', default: undefined },
    column9: { fromField: '', toField: 'Raw High', default: undefined },
    column10: { fromField: 'LORANGE', toField: 'Scaled Low', default: undefined },
    column11: { fromField: 'HIRANGE', toField: 'Scaled High', default: undefined },
    column12: { fromField: '', toField: 'Scaled Data Type', default: undefined },
    column13: { fromField: '', toField: 'Clamp Low', default: undefined },
    column14: { fromField: '', toField: 'Clamp High', default: undefined },
    column15: { fromField: '', toField: 'Eng Units', default: undefined },
    column16: { fromField: '', toField: 'Description', default: undefined },
    column17: { fromField: '', toField: 'Negate Value', default: undefined },
  },
  // filter: e.g. ['PNT', 'MEAS', 'SPT', 'OUT'],
  filter: ['PNT', 'MEAS', 'SPT', 'OUT'],
  inpFilter: ['NAMEINCOL', 'HIRANGE', 'LORANGE'],
  delimiterTo: ',',
  path: 'scripts/api/toKEPServer/fromFoxHist',
  jsonFileName: 'm52_v210802.json',// m51_v210729.json, m52_v210802.json
  inpFileNameFrom: 'm52-hist0_v210802.inp',// m51-hist0_v210729.inp, m52-hist0_v210802.inp
  csvFileNameTo: 'm52-kepServer_v210802.csv',// m51-kepServer_v210729.csv, m52-kepServer_v210802.csv
};

describe('<<=== ScriptOperations: (file-operations.script) ===>>', () => {

  // Update AddressSpaceOptions.json
  if (scriptExecution.updateAddressSpaceOptions) {
    it('#1: ScriptOperations: update AddressSpaceOptions.json', () => {
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

  // Converter from Fox Excel data `.csv` file to KEPServer
  if (scriptExecution.converterCsvForKEPServer) {
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
  }

  // Converter from Fox hist data `.inp` file to KEPServer
  if (scriptExecution.converterInpForKEPServer) {
    it('#3: ScriptOperations: Converter inp files for KEPServer', () => {
      let data, re, points = [], point;
      //-----------------------------------------------------
      const config = inpKepServerConfig;
      let path = config.path;
      let fileName = config.jsonFileName;
      // Remove json file
      if (doesFileExist([appRoot, path, fileName])) {
        removeFileSync([appRoot, path, fileName]);
      }
      //--- convert inp file to KEPServer ---
      fileName = config.inpFileNameFrom;
      // Read file
      data = readFileSync([appRoot, path, fileName]);
      // Get 
      re = /#{1}\s{1}\d+/;
      // debug('re:', re);
      // Get array items
      points = data.split(re);
      // Delete points[0] item
      points.shift();
      // Remove unnecessary characters from the last element of the array      
      const lastIndex = points.length - 1;
      const lastItem = points[lastIndex];
      re = /#{1}/;
      // Update last item
      points[lastIndex] = lastItem.split(re)[0];
      // Normalise items
      re = /\r\n/;
      for (let index = 0; index < points.length; index++) {
        let _item = points[index];
        let subItems = _item.split(re).filter(item => {
          return item.includes('=');
        });
        subItems = subItems.map(item => {
          item = item.trim();
          item = strReplace(item, ' ', '');
          return item;
        });
        subItems = subItems.filter(item => {
          const key = item.split('=')[0];
          return config.inpFilter.includes(key);
        });
        subItems = subItems.map(item => {
          let _item = strReplace(item, '=', '": "');
          _item = '"' + _item + '"';
          return _item;
        });
        // Convert string values to number values
        point = '{ ' + subItems.join(', ') + ' }';
        point = JSON.parse(point);
        point['HIRANGE'] = getFloat(point['HIRANGE']);
        point['LORANGE'] = getFloat(point['LORANGE']);
        // Convert string point to object point
        points[index] = point;
      }

      // Filter points
      points = points.filter(item => {
        const filterItem = item.NAMEINCOL.split('.')[1];
        return config.filter.includes(filterItem);
      });

      // Show points
      if (isLog) inspector('points.items:', points);
      // Show points length
      if(isDebug) debug('points.length:', points.length);

      // Write data to json file
      fileName = config.jsonFileName;
      writeJsonFileSync([appRoot, path, fileName], points);

      // Convert data
      const fields = config.fields;
      points = points.map(item => {
        let result = {};
        result[fields.column1.toField] = item[fields.column1.fromField].split('.')[0].split(':')[1];
        result[fields.column2.toField] = `52AW00/${item[fields.column2.fromField]}\\hist00`;
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
        result[fields.column16.toField] = item[fields.column16.fromField];
        result[fields.column17.toField] = item[fields.column17.default];
        return result;
      });

      // Write data to csv file
      let csv = papa.unparse(points, { delimiter: config.delimiterTo });
      fileName = config.csvFileNameTo;
      writeFileSync([appRoot, path, fileName], csv);

      assert.ok(true, 'update AddressSpaceOptions.json');
    });
  }
});
