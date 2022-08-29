/* eslint-disable no-unused-vars */
const {
  inspector,
  convertArray2Object,
  addIntervalId
} = require('../../lib');

const {
  MssqlTedious,
  getMssqlConfigFromEnv,
} = require('../../db-helpers');

const {
  formatUAVariable,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
} = require('../opcua-helper');

const { TYPES } = require('tedious');

const debug = require('debug')('app:getterHistValuesFromDB');
const isDebug = false;

//=============================================================================
/**
 * @method getValuesFromChAsoduDB
 * @param {Object} db 
 * @param {Object} params 
 * @returns {Object}
 */
const getValuesFromChAsoduDB = async function (db, queryParams) {
  const params = [];
  const sql = `
  SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
  FROM dbMonitor.dbo.SnapShot AS sh
  JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
  WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
  `;
  db.buildParams(params, 'scanerName', TYPES.Char, queryParams.scanerName);

  let rows = await db.query(params, sql);
  if (isDebug && rows.length) inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  // inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  if (rows.length) {
    rows = convertArray2Object(rows, 'TagName', 'Value');
    if (isDebug) inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
    // inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
  } else {
    rows = null;
  }
  return rows;
};

/**
 * @method getterHistValuesFromDB
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function getterHistValuesFromDB(params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Get db config
  let config = MssqlTedious.getDefaultConnConfig();
  config = getMssqlConfigFromEnv(config, params.dbEnv);
  if (isDebug) inspector('getMssqlConfigFromEnv.config:', config);

  //--- Set values from source ---
  const setValuesFromSource = function (dataItems) {
    if (isDebug) inspector('getterHistValuesFromDB.dataItems:', dataItems);
    dataType = formatUAVariable(addedValue).dataType[1];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  };

  // Gey data from DB
  // Set interval
  const intervalId = setInterval(async function () {
    let rows;
    const db = new MssqlTedious(config);
    await db.connect();
    // Select values from DB
    switch (params['queryFunc']) {
    case 'getValuesFromChAsoduDB':
      rows = await getValuesFromChAsoduDB(db, params.queryParams);
      break;
    default:
      break;
    }
    if (rows) {
      setValuesFromSource(rows);
    }
    await db.disconnect();
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
}

module.exports = getterHistValuesFromDB;
