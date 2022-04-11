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
const isScript = (argv.script === '#3');

// Config for converter from `Fox` hist data `.inp` file to KEPServer
const inpKepServerConfig = {
  fields: {
    column1: { fromField: 'NAMEINCOL', toField: 'Tag Name', default: undefined },
    column2: { fromField: ['NAMEINCOL'], toField: 'Address', default: undefined },
    column3: { fromField: '', toField: 'Data Type', default: 'Float' },
    column4: { fromField: '', toField: 'Respect Data Type', default: 1 },
    column5: { fromField: '', toField: 'Client Access', default: 'R' },
    column6: { fromField: '', toField: 'Scan Rate', default: 1000 },
    column7: { fromField: '', toField: 'Scaling', default: undefined },
    column8: { fromField: '', toField: 'Raw Low', default: undefined },
    column9: { fromField: '', toField: 'Raw High', default: undefined },
    column10: { fromField: 'LORANGE', toField: 'Scaled Low', default: undefined },
    column11: { fromField: 'HIRANGE', toField: 'Scaled High', default: undefined },
    column12: { fromField: '', toField: 'Scaled Data Type', default: undefined },
    column13: { fromField: '', toField: 'Clamp Low', default: undefined },
    column14: { fromField: '', toField: 'Clamp High', default: undefined },
    column15: { fromField: '', toField: 'Eng Units', default: undefined },
    column16: { fromField: 'NAMEINCOL', toField: 'Description', default: undefined },
    column17: { fromField: '', toField: 'Negate Value', default: undefined },
  },
  // filter: e.g. ['PNT', 'MEAS', 'SPT', 'OUT'],
  filter: ['PNT', 'MEAS', 'SPT', 'OUT'],
  inpFilter: ['NAMEINCOL', 'HIRANGE', 'LORANGE'],
  delimiterTo: ',',
  prefix: '52AW01',//51AW01
  postfix: 'hist01',//51hs01
  path: 'src/app/scripts/toKEPServer/fromFoxHist',
  jsonFileName: 'm52_v210802.json',// m51_v210729.json, m52_v210802.json
  inpFileNameFrom: 'm52-hist0_v210802.inp',// m51-hist0_v210729.inp, m52-hist0_v210802.inp
  csvFileNameTo: 'm52-kepServer_v210802.csv',// m51-kepServer_v210729.csv, m52-kepServer_v210802.csv
};

describe('<<=== ScriptOperations: (#3-converterInpForKEPServer) ===>>', () => {

  if (!isScript) return;
  // Converter from Fox hist data `.inp` file to KEPServer
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
    if (isDebug) debug('points.length:', points.length);

    // Write data to json file
    fileName = config.jsonFileName;
    writeJsonFileSync([appRoot, path, fileName], points);

    // Convert data
    const fields = config.fields;
    points = points.map(item => {
      let result = {};
      const tagName = item[fields.column1.fromField].split('.')[0].split(':')[1];
      result[fields.column1.toField] = tagName;
      result[fields.column2.toField] = `${config.prefix}\\${item[fields.column2.fromField]}\\${config.postfix}`;
      result[fields.column3.toField] = fields.column3.default;
      result[fields.column4.toField] = fields.column4.default;
      result[fields.column5.toField] = fields.column5.default;
      result[fields.column6.toField] = fields.column6.default;
      result[fields.column7.toField] = item[fields.column7.default];
      result[fields.column8.toField] = item[fields.column8.default];
      result[fields.column9.toField] = item[fields.column9.default];
      result[fields.column10.toField] = item[fields.column10.fromField];
      result[fields.column11.toField] = item[fields.column11.fromField];
      result[fields.column12.toField] = item[fields.column12.default];
      result[fields.column13.toField] = item[fields.column13.default];
      result[fields.column14.toField] = item[fields.column14.default];
      result[fields.column15.toField] = item[fields.column15.fromField];
      result[fields.column16.toField] = tagName;
      result[fields.column17.toField] = item[fields.column17.default];
      return result;
    });

    // Write data to csv file
    let csv = papa.unparse(points, { delimiter: config.delimiterTo });
    fileName = config.csvFileNameTo;
    writeFileSync([appRoot, path, fileName], csv);

    assert.ok(true, 'update AddressSpaceOptions.json');
  });
});
