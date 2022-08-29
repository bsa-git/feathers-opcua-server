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
  getFileStatSync,
  addIntervalId
} = require('../../lib');

const {
  XlsxHelperClass,
} = require('../../excel-helpers');

const loRandom = require('lodash/random');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:getterAcmDayValueFromFile');
const isDebug = false;

//=============================================================================

/**
 * @method getterAcmDayValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const getterAcmDayValueFromFile = function (params = {}, addedValue) {
  let dataItems, currentDate, dataType;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  const path = createPath(params.path);
  const excelMappingFrom = params.excelMappingFrom;
  const rangeData = excelMappingFrom.rangeData;
  const headerNames = excelMappingFrom.headerNames;
  const rangeDate = excelMappingFrom.rangeDate;

  const startYear = moment.utc().format('YYYY');

  // Watch read only new file
  readOnlyModifiedFile(path, (filePath, data) => {

    // Show filePath, data
    if (isDebug && filePath) console.log(chalk.green(
      `getterAcmDayValueFromFile.readOnlyModifiedFile(${getTime('', false)}).filePath:`), 
    chalk.cyan(getPathBasename(filePath))
    );

    // Get updatedAt time for file
    const updatedAt = getFileStatSync(filePath).updatedAt;
    const fileName = getPathBasename(filePath);

    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: filePath,
      sheetName: 'Report1'
    });

    // Sheet to json data
    dataItems = xlsx.sheetToJson('Report1', { range: rangeData, header: headerNames });
    if (isDebug && dataItems.length) inspector(`getterAcmDayValueFromFile.dataItems(${dataItems.length}):`, dataItems);

    // Sheet to json date
    let dateTime = xlsx.sheetToJson('Report1', { range: rangeDate });
    if (isDebug && dateTime) console.log('getterAcmDayValueFromFile.sheetDateTime:', dateTime);
    // dateTime = dateTime[0]['A'].split('to:')[0].split('from:')[1].trim();
    dateTime = dateTime[0]['A'].split('to:')[1].trim();
    dateTime = moment.utc(dateTime).format('YYYY-MM-DD');
    if (isDebug && dateTime) console.log('getterAcmDayValueFromFile.dateTime:', dateTime);

    // Set value from source
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    dataItems['!value'] = { dateTime, updatedAt, fileName };
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });
    if (isDebug && dataItems) inspector('getterAcmDayValueFromFile.dataItems:', dataItems);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }

    // Remove file 
    removeFileSync(filePath);
  });

  // Set interval
  const intervalId = setInterval(function () {
    let jsonData;
    //------------------------
    // Skip the first cycle to desynchronize the cycles
    // if(currentDate === undefined){
    //   currentDate = null;
    //   return;
    // }

    // Get current date    
    if(currentDate){
      currentDate = moment.utc(currentDate).add(1, 'days').format('YYYY-MM-DD');
      const currentYear = currentDate.split('-')[0];
      if((currentYear !== startYear) && params.isTest){
        currentDate = moment.utc([startYear, 0, 1]).subtract(1, 'days').format('YYYY-MM-DD');
      }
    } else {
      currentDate = moment.utc([startYear, 0, 1]).subtract(1, 'days').format('YYYY-MM-DD');
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
        row['F'] = loRandom(0, 1);
        if(row['F']){
          row['C'] = loRandom(0, 1);
          row['E'] = loRandom(0, 1);
        }
      }
      return row;
    });

    // console.log('jsonData[0][\'A\']:', jsonData[0]['A']);

    // Create xlsx object
    xlsx = new XlsxHelperClass({
      jsonData,
      sheetName: 'Report1'
    });

    // Write new data to xls file fromFile
    const toFile = getPathBasename(params.fromFile, '.xls');
    const fileName = getFileName(`${toFile}-`, 'xls', true);
    xlsx.writeFile([appRoot, params.path, fileName]);
  }, params.interval);
  
  // Add interval Id to list
  addIntervalId(intervalId);
};


module.exports = getterAcmDayValueFromFile;
