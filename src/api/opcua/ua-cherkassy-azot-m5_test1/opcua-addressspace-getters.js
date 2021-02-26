/* eslint-disable no-unused-vars */
const os = require('os');
const {
  Variant,
  DataType,
  // StatusCodes,
  // VariantArrayType,
  // standardUnits,
  // makeAccessLevelFlag,
} = require('node-opcua');

const chalk = require('chalk');
const papa = require('papaparse');


const {
  appRoot,
  getTime,
  inspector,
} = require('../../../plugins/lib/util');

const {
  setValueFromSourceForGroup,
  formatUAVariable
} = require('../../../plugins/opcua/opcua-helper');

const {
  readOnlyNewFile,
  readFileSync,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename
} = require('../../../plugins/lib/file-operations');

const loRound = require('lodash/round');
const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');
const moment = require('moment');
const { pause } = require('../../../plugins/lib');

const debug = require('debug')('app:opcua-addressspace-getters');
const isDebug = false;
const isLog = false;

/**
 * @method getTValue
 * @param {Number} t 
 * @returns {Number}
 */
const getTValue = function (t) {
  let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
  return loRound(value, 3);
};


function histValueFromFileForCH_M51(params = {}, addedValue) {
  const _interval = 200;
  const _path = 'test/data/tmp';
  let dataItems, dataType, results;
  let interval = params.interval ? params.interval : _interval;
  let path = params.path ? params.path : _path;
  let id = params.myOpcuaServer.id;

  // Watch read only new file
  readOnlyNewFile([appRoot, path], (filePath, data) => {
    // Show filePath, data
    if (isDebug) console.log(chalk.green('histValueFromFile.file:'), chalk.cyan(getPathBasename(filePath)));
    if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    if (isLog) inspector('histValueFromFileForCH_M51.dataItems:', dataItems);
    // inspector('histValueFromFileForCH_M51.dataItems:', dataItems);

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }

  });
  // Write file
  setInterval(function () {
    let csv = readFileSync([appRoot, '/src/api/opcua', id, 'data-CH_M51.csv']);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      loForEach(results.data[0], function (value, key) {
        results.data[0][key] = getTValue(value);
      });
      csv = papa.unparse(results.data, { delimiter: ';' });
      if (isLog) inspector('histValueFromFileForCH_M51.unparse.csv:', csv);
    }
    const fileName = getFileName('data-', 'csv', true);
    writeFileSync([appRoot, path, fileName], csv);
  }, interval);
}


module.exports = {
  histValueFromFileForCH_M51,
};
