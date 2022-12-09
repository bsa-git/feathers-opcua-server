/* eslint-disable no-unused-vars */
const {
  inspector,
  addIntervalId,
  isFunction
} = require('../../lib');

const { MssqlTedious } = require('../../db-helpers');

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
  let dataType;
  const app = params.myOpcuaServer.app;
  //------------------------------------

  // Get mssql service
  const service = app.service('mssql-datasets');
  const mssqlId = MssqlTedious.getIdFromConfig(params.dbEnv);

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
    let rows;
    //-------------------------------
    // Execute query MsSql DB
    rows = await service.executeQuery(mssqlId, params);

    if (rows) {
      setValuesFromSource(rows);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
}

module.exports = getterHistValuesFromMsSqlDB;
