/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');

const {
  appRoot,
  inspector,
  isNumber,
  readOnlyModifiedFile,
  getTime,
  removeFileSync,
  getFileName,
  getPathBasename,
  createPath,
} = require('../../lib');

const {
  XlsxHelperClass,
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
  let dataItems, currentDate, dataType;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  // debug('histValueFromFile.params.path:', params.path); // test/data/tmp/ch-m52_acm
  const path = createPath(params.path);
  const excelMappingFrom = params.excelMappingFrom;
  const rangeData = excelMappingFrom.rangeData;
  const headerNames = excelMappingFrom.headerNames;
  const rangeDate = excelMappingFrom.rangeDate;

  // Watch read only new file
  readOnlyModifiedFile(path, (filePath, data) => {

    // Show filePath, data
    if (isDebug && filePath) console.log(chalk.green(`acmDayValueFromFile.readOnlyModifiedFile(${getTime('', false)}).filePath:`), chalk.cyan(getPathBasename(filePath)));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: filePath,
      sheetName: 'Report1'
    });

    // Sheet to json data
    dataItems = xlsx.sheetToJson('Report1', { range: rangeData, header: headerNames });
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

    // Get current date    
    if(currentDate){
      currentDate = moment.utc(currentDate).add(1, 'days').format('YYYY-MM-DD');
    } else {
      const startYear = moment.utc().format('YYYY');
      currentDate = moment.utc([startYear, 0, 1]).format('YYYY-MM-DD');
    }
    const nextDate = moment.utc(currentDate).add(1, 'days').format('YYYY-MM-DD');
    const templateDate = `data period - from: ${currentDate} 00:00 to: ${nextDate} 00:00`;

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: [appRoot, params.fromFile],
      sheetName: 'Report1'
    });

    // Sheet to json
    jsonData = xlsx.sheetToJson();

    // Map  jsonData   
    jsonData[0]['A'] = templateDate;
    jsonData = jsonData.map(row => {
      if (row['F'] && isNumber(row['F'])) {
        row['B'] = loRandom(300, 2000);
        row['D'] = loRandom(30000, 300000);
      }
      return row;
    });

    // console.log('jsonData[0][\'A\']:', jsonData[0]['A']);

    // Create xlsx object
    xlsx = new XlsxHelperClass({
      jsonData,
      sheetName: 'Report1'
    });

    // Write new data to xls file
    const fileName = getFileName(`${params.toFile}-`, 'xls', true);
    xlsx.writeFile([appRoot, path, fileName]);

  }, params.interval);
};


module.exports = acmDayValueFromFile;
