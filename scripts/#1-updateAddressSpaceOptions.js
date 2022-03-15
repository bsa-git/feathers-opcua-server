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
if(isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = argv.script === 'updateAddressSpaceOptions' || argv.script === '#1';

describe('<<=== ScriptOperations: (#1-updateAddressSpaceOptions) ===>>', () => {

  // Update AddressSpaceOptions.json
  if (isScript) {
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
});
