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
 * @method getValue
 * @param {Number} v 
 * @returns {Number}
 */
const getValue = function (v) {
  let value = (Math.sin(v / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
  return loRound(value, 3);
};

/**
 * @method deleteValuesFromDB
 * @param {Object} db 
 */
const deleteValuesFromDB = async function (db) {
  const params = [];
  const sql = 'DELETE FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
  db.buildParams(params, 'Type', TYPES.Char, 'tag');
  db.buildParams(params, 'Value', TYPES.Char, 'CH_M52::ValueFromFile');
  await db.query(params, sql);
};

/**
 * @method selValuesFromDB
 * @param {Object} db 
 * @returns {Object[]}
 */
const selValuesFromDB = async function (db) {
  const params = [];
  const sql = 'SELECT * FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
  db.buildParams(params, 'Type', TYPES.Char, 'tag');
  db.buildParams(params, 'Value', TYPES.Char, 'CH_M52::ValueFromFile');
  const rows = await db.query(params, sql);
  return rows;
};

/**
 * @method insertValuesToDB
 * @param {Object} db 
 * @param {Object} value 
 */
const insertValuesToDB = async function (db, value) {
  const params = [];
  const sql = 'INSERT INTO dbo.tblMessages VALUES (@value, @type, @text)';
  if (isLog) inspector('insertValuesToDB.value:', value);
  db.buildParams(params, 'Value', TYPES.Char, 'CH_M52::ValueFromFile');
  db.buildParams(params, 'Type', TYPES.Char, 'tag');
  db.buildParams(params, 'Text', TYPES.Char, value);
  await db.query(params, sql);
};

/**
 * @method updateValueFromDB
 * @param {Object} db 
 * @param {Object} value 
 */
const updateValueFromDB = async function (db, value) {
  const params = [];
  const sql = 'UPDATE dbo.tblMessages SET Text = @text WHERE Type = @type AND Value = @value';
  if (isLog) inspector('updateValuesFromDB.value:', value);
  db.buildParams(params, 'Value', TYPES.Char, 'CH_M52::ValueFromFile');
  db.buildParams(params, 'Type', TYPES.Char, 'tag');
  db.buildParams(params, 'Text', TYPES.Char, value);
  await db.query(params, sql);
};


/**
 * @method histValueFromFile
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
function histValueFromDB(params = {}, addedValue) {
  let dataItems, dataType, results;
  let id = params.myOpcuaServer.id;
  //------------------------------------
  // Get db config
  let config = MssqlTedious.getDefaultConnConfig();
  config = getMssqlConfigFromEnv(config, params.dbEnv);
  if (isLog) inspector('getMssqlConfigFromEnv.config:', config);

  // Select data from DB
  const readValueFromDB = async function (db) {
    const rows = await selValuesFromDB(db);
    // Set value from source
    
    dataItems = rows[0]['Text'];
    // inspector('histValueFromDB.dataItems:', dataItems);
    dataItems = JSON.parse(dataItems);
    if (isLog) inspector('histValueFromDB.dataItems:', dataItems);
    // inspector('histValueFromDB.dataItems:', dataItems);
    dataType = formatUAVariable(addedValue).dataType[1];
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems, module.exports);
    }

    await deleteValuesFromDB(db);
  };
  // Write data to DB
  setInterval(async function () {
    let csv = '', json = '';
    csv = readFileSync([appRoot, '/src/api/opcua', id, params.fromFile]);
    if (csv) {
      results = papa.parse(csv, { delimiter: ';', header: true });
      json = results.data[0];
      loForEach(json, function (value, key) {
        json[key] = getValue(value);
      });
      if (isLog) inspector('histValueFromDB.json:', json);
      // inspector('histValueFromDB.json:', json);
    }
    // Insert or Update values
    const db = new MssqlTedious(config);
    await db.connect();
    const rows = await selValuesFromDB(db);
    if (rows.length) {
      await updateValueFromDB(db, JSON.stringify(json));
    } else {
      await insertValuesToDB(db, JSON.stringify(json));
    }

    await readValueFromDB(db);

    await db.disconnect();
  }, params.interval);
}

module.exports = Object.assign({}, opcuaGetters, {
  histValueFromDB,
});
