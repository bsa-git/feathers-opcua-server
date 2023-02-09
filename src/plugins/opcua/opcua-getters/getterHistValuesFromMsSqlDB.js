/* eslint-disable no-unused-vars */
const chalk = require('chalk');

const {
  inspector,
  logger,
  addIntervalId,
  getDateTime,
  Queue
} = require('../../lib');

const { MssqlTedious } = require('../../db-helpers');
const queryFuncs = require('../../db-helpers/lib');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const debug = require('debug')('app:getterHistValuesFromMsSqlDB');
const isDebug = false;


/**
 * @method getterHistValuesFromMsSqlDB
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function getterHistValuesFromMsSqlDB(params = {}, addedValue) {
  let dataType, queue = null;
  const app = params.myOpcuaServer.app;
  //------------------------------------

  // Set values from source
  const setValuesFromSource = function (dataItems) {
    if (isDebug) inspector('getterHistValuesFromMsSqlDB.dataItems:', dataItems);
    dataType = formatUAVariable(addedValue).dataType[1];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  };

  // Set interval
  const intervalId = setInterval(async function () {
    //-------------------------------
    try {
      const browseName = formatUAVariable(addedValue).browseName;
      // Create queue
      queue = new Queue(browseName, 'mssql-list');
      await queue.doWhile();

      // Create an instance of a class
      const mssqlDB = new MssqlTedious(params.dbEnv);
      // mssqlDB connect
      await mssqlDB.connect();

      // Execute query MsSql DB
      const queryFunc = params.queryFunc;
      const queryParams = params.queryParams;
      const { rows } = await mssqlDB.executeQuery(queryFunc, queryParams);
      if (rows) {
        setValuesFromSource(rows);
      }
      // mssqlDB disconnect
      if (mssqlDB.connection) await mssqlDB.disconnect();

      // Drop item from the beginning of array
      queue.dropCurrentItem();

    } catch (error) {
      // Drop item from the beginning of array
      if (queue) queue.dropCurrentItem();
      const errorMessage = error.message? error.message : error;
      logger.error(`getterHistValuesFromMsSqlDB.Error: "${errorMessage}"`);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
}

module.exports = getterHistValuesFromMsSqlDB;
