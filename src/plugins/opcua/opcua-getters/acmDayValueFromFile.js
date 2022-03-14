/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');

const {
  appRoot,
  inspector,
  isBoolean,
  readOnlyNewFile,
  readOnlyModifiedFile,
  getTime,
  stripSpecific,
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
const { index } = require('cheerio/lib/api/traversing');

const debug = require('debug')('app:opcua-getters/histValueFromFile');
const isDebug = false;
const isLog = false;


//=============================================================================

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const acmDayValueFromFile = function (params = {}, addedValue) {
  let dataItems, dataItems2, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  // debug('histValueFromFile.params.path:', params.path); // test/data/tmp/ch-m52_acm
  const path = createPath(params.path);
  const excelMappingFrom = params.excelMappingFrom;
  const rangeData = excelMappingFrom.rangeData;
  const headerData = excelMappingFrom.headerData;
  const rangeDate = excelMappingFrom.rangeDate;

  // Watch read only new file
  readOnlyModifiedFile(path, (filePath, data) => {

    // console.log('acmDayValueFromFile:', rangeData, rangeDate, headerData);

    // Show filePath, data
    if (isDebug && filePath) console.log(chalk.green(`acmDayValueFromFile.readOnlyModifiedFile(${getTime('', false)}).filePath:`), chalk.cyan(getPathBasename(filePath)));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    // console.log('acmDayValueFromFile.dataType:', dataType);

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: filePath,
      sheetName: 'Report1'
    });

    // Sheet to json data
    dataItems = xlsx.sheetToJson('Report1', { range: rangeData, header: headerData });
    if (isDebug && dataItems.length) inspector(`histValueFromFile.dataItems(${dataItems.length}):`, dataItems);

    // Sheet to json date
    let date = xlsx.sheetToJson('Report1', { range: rangeDate });
    date = date[0]['A'].split('to:')[0].split('from:')[1].trim();
    date = moment(date).format().split('T')[0];
    if (isDebug && date) inspector('histValueFromFile.date:', date);

    // Set value from source
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    dataItems['!value'] = { date };
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isDebug && dataItems) inspector('histValueFromFile.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }

    // Remove file 
    removeFileSync(filePath);
  });


  // Write file
  setInterval(function () {
    let jsonData;
    //------------------------
    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: [appRoot, '/src/api/opcua', id, params.fromFile],
      sheetName: 'Report1'
    });

    // Sheet to json
    jsonData = xlsx.sheetToJson();
    // Map  jsonData   
    jsonData = jsonData.map(row => {
      if (row['F'] && isBoolean(row['F'])) {
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
    xlsx.writeFile([appRoot, path, fileName]);

  }, params.interval);
};


module.exports = acmDayValueFromFile;
