/* eslint-disable no-unused-vars */
const moment = require('moment');
const { TYPES } = require('tedious');

const {
  inspector,
  logger
} = require('../../lib');

const {
  MssqlTedious,
} = require('..');

const debug = require('debug')('app:getValuesFromChAsoduDB');
const isDebug = false;

//=============================================================================
/**
 * @method insertValuesToChAsoduDB
 * @param {Object} db 
 * @param {Object} queryParams 
 * e.g. {
 *  scanerName: 'opcUA(A5)',
    tagGroup: 'XozUchet',
    dateTime: '2022-12-19T08:52:56',
    opcuaValues: [
    { F59AM: 71.1017837524414 },
    { F21AM: null },
    ...,
    { F98: 114.83361053466797 },
    { F93: 87.92138671875 }
  ]
 * 
 * }
 * @returns {Object}
 */
const insertValuesToChAsoduDB = async function (db, queryParams) {
  let sql = '', result, rows, params = [];
  let rowSnapShot = {}, rowsSnapShot = [];
  const tableName = 'SnapShot'; // 'SnapShotTest', 'SnapShot'
  const scanerName = queryParams.scanerName;
  const tagGroup = queryParams.tagGroup;
  const dateTime = queryParams.dateTime;
  const opcuaValues = queryParams.opcuaValues;
  //--------------------------------------
  try {
    // Connect DB
    if(!db.currentState.isConnected) await db.connect();

    if (isDebug && queryParams) inspector('insertValues4ChAsoduDB.queryParams:', queryParams);

    // Select rows from SnapShot table
    params = [];
    sql = `
    SELECT tInfo.ID, tInfo.TagName, tInfo.ScaleMin, tInfo.ScaleMax
    FROM dbConfig.dbo.TagsInfo AS tInfo
    WHERE tInfo.ScanerName = @scanerName AND 
          tInfo.TagGroup = @tagGroup AND
          tInfo.OnOff=1
    ORDER BY ID
    `;

    db.buildParams(params, 'scanerName', TYPES.Char, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.Char, tagGroup);

    result = await db.query(params, sql);
    rows = result.rows;
    if (isDebug && rows) inspector('Get tags from TagsInfo.rows:', rows);

    for (let index = 0; index < rows.length; index++) {
      rowSnapShot = {};
      const row = rows[index];
      const tagOpcuaValue = opcuaValues.find(opcuaValue => opcuaValue[row.TagName] !== undefined);
      if (tagOpcuaValue) {
        const dt = moment(dateTime);
        rowSnapShot['TagID'] = row.ID;
        rowSnapShot['ScanerName'] = scanerName;
        rowSnapShot['TagGroup'] = tagGroup;
        rowSnapShot['Time'] = dt.format('YYYY-MM-DDTHH:mm:ss');
        rowSnapShot['dtYear'] = dt.year();
        rowSnapShot['dtDofY'] = dt.dayOfYear();
        rowSnapShot['dtTotalS'] = (dt.hours() * 3600) + dt.seconds();
        rowSnapShot['Value'] = tagOpcuaValue[row.TagName];

        rowsSnapShot.push(rowSnapShot);
      }
    }
    if (isDebug && rowsSnapShot.length) inspector('Get tags from TagsInfo.rowsSnapShot:', rowsSnapShot);

    if(!rowsSnapShot.length) return { rows: [], rowCount: 0 };

    //--- Begin transaction ---
    await db.beginTransaction();

    // Remove rows from dbBSA.dbo.SnapShot
    sql = `
    DELETE sh FROM dbBSA.dbo.${tableName} AS sh
    WHERE (sh.ScanerName = @scanerName) AND (sh.TagGroup = @tagGroup OR sh.TagGroup IS NULL)
    `;
    params = [];
    db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.VarChar, tagGroup);

    result = await db.query(params, sql);
    if (isDebug && result) inspector('Delete rows from dbBSA.dbo.SnapShot:', result.rowCount);


    // Insert row to dbBSA.dbo.SnapShotTest
    for (let index = 0; index < rowsSnapShot.length; index++) {
      params = [];
      const _rowSnapShot = rowsSnapShot[index];
      sql = `
      INSERT INTO dbBSA.dbo.${tableName} 
      (TagID, ScanerName, Time, dtYear, dtDofY, dtTotalS, Value, TagGroup)
      VALUES (@tagID, @scanerName, '${_rowSnapShot['Time']}', @dtYear, @dtDofY, @dtTotalS, @value, @tagGroup)
      `;

      db.buildParams(params, 'tagID', TYPES.Int, _rowSnapShot['TagID']);
      db.buildParams(params, 'scanerName', TYPES.VarChar, _rowSnapShot['ScanerName']);
      db.buildParams(params, 'dtYear', TYPES.SmallInt, _rowSnapShot['dtYear']);
      db.buildParams(params, 'dtDofY', TYPES.SmallInt, _rowSnapShot['dtDofY']);
      db.buildParams(params, 'dtTotalS', TYPES.Int, _rowSnapShot['dtTotalS']);
      db.buildParams(params, 'value', TYPES.Real, _rowSnapShot['Value']);
      db.buildParams(params, 'tagGroup', TYPES.VarChar, _rowSnapShot['TagGroup']);
      // Run query
      result = await db.query(params, sql);
      if (isDebug && result) inspector('INSERT rows to dbBSA.dbo.SnapShotTest:', result.rowCount);
    }

    sql = `
    SELECT *
    FROM dbBSA.dbo.${tableName} AS sh
    WHERE (sh.ScanerName = @scanerName) AND (sh.TagGroup = @tagGroup OR sh.TagGroup IS NULL)
    `;

    params = [];
    db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.VarChar, tagGroup);

    result = await db.query(params, sql);
    rows = result.rows;
    if (rows.length) {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        row['Time'] = moment(row['Time']).format();
      }
    }
    if (isDebug && rows) inspector('Get values from dbBSA.dbo.SnapShot.rows:', rows);

    //--- Commit transaction ---
    await db.commitTransaction();

    // await db.disconnect();

    return { rows, rowCount: result.rowCount };

  } catch (error) {
    //--- Rollback transaction ---
    await db.rollbackTransaction(error.message);
  }
};
module.exports = insertValuesToChAsoduDB;
