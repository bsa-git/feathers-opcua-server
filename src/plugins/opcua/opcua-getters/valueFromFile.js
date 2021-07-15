/* eslint-disable no-unused-vars */
const papa = require('papaparse');

const {
  appRoot,
  inspector,
  getRandomValue,
  readFileSync
} = require('../../lib');


const loForEach = require('lodash/forEach');

const {
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:opcua-getters/valueFromFile');
const isDebug = false;
const isLog = false;

//=============================================================================

/**
 * @method valueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {String}
 */
const valueFromFile = function (params = {}, addedValue) {
  let dataItems, results;
  let id = params.myOpcuaServer.id;
  //------------------------------
  // Read file
  let csv = readFileSync([appRoot, '/src/api/opcua', id, params.fromFile]);
  results = papa.parse(csv, { delimiter: ';', header: true });
  loForEach(results.data[0], function (value, key) {
    results.data[0][key] = getRandomValue(value);
  });
  dataItems = results.data[0];
  dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
  if (isLog) inspector('valueFromFile.dataItems:', dataItems);
  // Set value from source for group 
  if (params.addedVariableList) {
    setValueFromSourceForGroup(params, dataItems);
  }
  return JSON.stringify(dataItems);
};


module.exports = valueFromFile;
