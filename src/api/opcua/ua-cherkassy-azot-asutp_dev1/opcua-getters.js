/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const papa = require('papaparse');

// const {
//   appRoot,
//   inspector,
//   httpGetNewFileFromDir,
//   readOnlyNewFile,
//   readFileSync,
//   writeFileSync,
//   removeFileSync,
//   getFileName,
//   getPathBasename,
//   createPath
// } = require('../lib');


// const {
//   formatUAVariable,
//   setValueFromSourceForGroup
// } = require('./opcua-helper');

const {
  appRoot,
  inspector,
  MssqlTedious,
  getMssqlConfigFromEnv,
  readFileSync,
  formatUAVariable,
  setValueFromSourceForGroup
} = require('../../../plugins');

const opcuaGetters = require('../../../plugins/opcua/opcua-getters');

const {
  DataType,
} = require('node-opcua');

const { TYPES } = require('tedious');
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

const debug = require('debug')('app:opcua-getters');
const isDebug = false;
const isLog = false;

//=============================================================================

/**
 * @method convertArray2Object
 * @param {Object[]} array 
 * @param {String} key 
 * @param {String} value 
 * @returns {Object}
 */
const convertArray2Object = function (array, key, value) {
  let rows = {};
  loForEach(array, row => {
    rows[row[key]] = loRound(row[value], 3);
  });
  return rows;
};


/**
 * @method selectValuesFromChAsoduDB
 * @param {Object} db 
 * @param {Object} params 
 * @returns {Object}
 */
const selectValuesFromChAsoduDB = async function (db, queryParams) {
  const params = [];
  const sql = `
  SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
  FROM dbMonitor.dbo.SnapShot AS sh
  JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
  WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
  `;
  db.buildParams(params, 'scanerName', TYPES.Char, queryParams.scanerName);

  let rows = await db.query(params, sql);
  if (isLog) inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  // inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  if (rows.length) {
    rows = convertArray2Object(rows, 'TagName', 'Value');
    if (isLog) inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
    // inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
  } else {
    rows = null;
  }
  return rows;
};

/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValuesFromDB(params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Get db config
  let config = MssqlTedious.getDefaultConnConfig();
  config = getMssqlConfigFromEnv(config, params.dbEnv);
  if (isLog) inspector('getMssqlConfigFromEnv.config:', config);

  // Set values from source
  const setValuesFromSource = function (dataItems) {
    if (isLog) inspector('histValuesFromDB.dataItems:', dataItems);
    // inspector('histValuesFromDB.dataItems:', dataItems);
    dataType = formatUAVariable(addedValue).dataType[1];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }
  };

  // Gey data from DB
  setInterval(async function () {
    let rows;
    const db = new MssqlTedious(config);
    await db.connect();
    // Select values from DB
    switch (params['queryFunc']) {
    case 'selectValuesFromChAsoduDB':
      rows = await selectValuesFromChAsoduDB(db, params.queryParams);
      break;
    default:
      break;
    }
    if (rows) {
      setValuesFromSource(rows);
    }
    await db.disconnect();
  }, params.interval);
}

module.exports = Object.assign({}, opcuaGetters, {
  histValuesFromDB,
});
