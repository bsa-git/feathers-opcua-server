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
 * @method getterAcmDayValueFromPath
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const getterAcmDayValueFromPath = function (params = {}, addedValue) {
  let dataItems, currentDate, dataType;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Create path
  const path = createPath(params.path);
  const excelMappingFrom = params.excelMappingFrom;
  const rangeData = excelMappingFrom.rangeData;
  const headerNames = excelMappingFrom.headerNames;
  const rangeDate = excelMappingFrom.rangeDate;

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
};


module.exports = getterAcmDayValueFromPath;
