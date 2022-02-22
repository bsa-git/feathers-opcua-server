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

  // Watch read only new file
  readOnlyModifiedFile(path, (filePath, data) => {


    // Show filePath, data
    if (true && filePath) console.log(chalk.green(`acmDayValueFromFile.readOnlyModifiedFile(${getTime('', false)}).filePath:`), chalk.cyan(getPathBasename(filePath)));
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    // console.log('acmDayValueFromFile.dataType:', dataType);

    // results = papa.parse(data, { delimiter: ';', header: true });
    // dataItems = results.data[0];
    // dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    // addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Create xlsx object
    let xlsx = new XlsxHelperClass({
      excelPath: filePath,
      sheetName: 'Report1'
    });

    // Sheet to json
    dataItems = xlsx.sheetToJson('Report1', { range: 'A6:B13' }); // B6:E29
    // dataItems2 = xlsx.sheetToJson('Report1', { range: 'J6:J29' });
    // dataItems = dataItems.map((item, index) => {
    //   item['J'] = dataItems2[index]['J'];
    //   return item;
    // });
    // loForEach(dataItems, (item, index) => {

    // });
    // dataItems = Object.assign(dataItems, dataItems2);
    if (true && dataItems) inspector(`histValueFromFile.dataItems(${dataItems.length}):`, dataItems);

    // dataItems = xlsx.getCells('Report1', { range: 'B6:B7' });

    // loForEach(dataItems, (item) => {
    //   if (isDebug && item) inspector('histValueFromFile.dataItems:',  loOmit(item, ['xlsx', 'workbook', 'worksheet', 'cell']));
    // });



    // Set value from source for group 
    // if (params.addedVariableList) {
    //   setValueFromSourceForGroup(params, dataItems);
    // }

    // Remove file 
    // removeFileSync(filePath);
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
    const resultPath = xlsx.writeFile([appRoot, path, fileName]);
    // const jsonData2 = xlsx.readFile(resultPath, 'Report1').sheetToJson();
    // if (isLog && jsonData2.length) inspector('acmDayValueFromFile.jsonData2:', jsonData2);
  }, params.interval);
};


module.exports = acmDayValueFromFile;
