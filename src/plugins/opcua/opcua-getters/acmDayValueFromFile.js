/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

const {
  appRoot,
  inspector,
  isBoolean,
  readOnlyNewFile,
  readOnlyModifiedFile,
  getTime,
  pause,
  delay,
  readFileSync,
  writeFileSync,
  removeFileSync,
  getFileName,
  getPathBasename,
  createPath,
  getRandomValue
} = require('../../lib');

const {
  XlsxHelperClass,
  ExceljsHelperClass,
} = require('../../excel-helpers');

const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');
const loStartsWith = require('lodash/startsWith');
const loRandom = require('lodash/random');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:opcua-getters/histValueFromFile');
const isDebug = true;
const isLog = false;


//=============================================================================

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const acmDayValueFromFile = function (params = {}, addedValue) {
  let dataItems, dataType, results, jsonData;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  // debug('histValueFromFile.params.path:', params.path);
  const path = createPath(params.path);

  // Watch read only new file
  readOnlyModifiedFile(path, (filePath, data, eventType) => {

    // isRun =  (currentSec === -1) || dtToObject('', false).seconds;

    // Show filePath, data
    if (true && filePath) console.log(chalk.green(`acmDayValueFromFile(${eventType}).readOnlyModifiedFile(${getTime('', false)}).filePath:`), chalk.cyan(getPathBasename(filePath)));
    // if (isDebug) console.log(chalk.green('histValueFromFile.data:'), chalk.cyan(data));
    /*
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isLog) inspector('histValueFromFile.dataItems:', dataItems);
    
    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
    */

    // Remove file 
    // removeFileSync(filePath);
  });

  // readOnlyNewFile(path, (filePath, data, eventType) => {

  //   // isRun =  (currentSec === -1) || dtToObject('', false).seconds;

  //   // Show filePath, data
  //   if (true && filePath) console.log(chalk.green(`acmDayValueFromFile(${eventType}).readOnlyNewFile(${getTime('', false)}).filePath:`), chalk.cyan(getPathBasename(filePath)));
  // });

  // readOnlyModifiedFile(path, (filePath, data) => {
  //   if (true && filePath) console.log(chalk.green('acmDayValueFromFile.readOnlyModifiedFilepath.filePath:'), chalk.cyan(getPathBasename(filePath)));
  // });

  // Write file
  setInterval(function () {

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: [appRoot, '/src/api/opcua', id, params.fromFile],
      sheetName: 'Report1'
    });

    // Sheet to json
    jsonData = xlsx.sheetToJson();
    // Map  jsonData   
    jsonData = jsonData.map(row => {
      if (row['J'] && isBoolean(row['J'])) {
        row['B'] = loRandom(300, 2000);
        row['D'] = loRandom(30000, 300000);
      }
      return row;
    });

    // Create xlsx object
    xlsx = new XlsxHelperClass({
      jsonData,
      sheetName: 'Report1'
    });

    // Write new data to xls file
    const fileName = getFileName('DayHist01_14F120-', 'xls', true);
    const resultPath = xlsx.writeFile([appRoot, 'test/data/tmp/ch-m52_acm', fileName]);
    const jsonData2 = xlsx.readFile(resultPath, 'Report1').sheetToJson();

    /*
    console.log('getTime1:', getTime('', false));

    delay(1000).then(() => {
      // Map  jsonData2   
      jsonData = jsonData2.map(row => {
        if (row['J'] && isBoolean(row['J'])) {
          row['B'] = loRandom(300, 2000);
          row['D'] = loRandom(30000, 300000);
        }
        return row;
      });

      xlsx.sheetAddJson(jsonData, { origin: 'A1' });
      xlsx.writeFile(resultPath);
      console.log('getTime2:', getTime('', false));
    });
    */
    if (isLog && jsonData2.length) inspector('acmDayValueFromFile.jsonData:', jsonData);

  }, params.interval);
};


module.exports = acmDayValueFromFile;
