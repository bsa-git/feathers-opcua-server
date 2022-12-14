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
 * @method insertValues4ChAsoduDB
 * @param {Object} db 
 * @param {Object} queryParams 
 * @returns {Object}
 */
const insertValues4ChAsoduDB = async function (db, queryParams) {
  let sql = '', result, rows, params = [];
  const scanerName = queryParams.scanerName;
  const tagGroup = queryParams.tagGroup;
  const data = queryParams.data;
  //--------------------------------------
  try {
    await db.connect();

    //--- Begin transaction ---
    await db.beginTransaction();

    if (isDebug && queryParams) inspector('insertValues4ChAsoduDB.queryParams:', queryParams);

    // Remove rows from dbBSA.dbo.SnapShotTest
    sql = `
    DELETE sh FROM dbBSA.dbo.SnapShotTest AS sh
    WHERE (sh.ScanerName = @scanerName) AND (sh.TagGroup = @tagGroup OR sh.TagGroup IS NULL)
    `;
    params = [];
    db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.VarChar, tagGroup);

    result = await db.query(params, sql);
    if (isDebug && result) inspector('Delete rows from dbBSA.dbo.SnapShotTest:', result.rowCount);

    // Insert row to dbBSA.dbo.SnapShotTest
    const table = 'dbBSA.dbo.SnapShotTest';
    const colums = [
      ['TagID', TYPES.Int, { nullable: false }],
      ['ScanerName', TYPES.VarChar, { nullable: false }],
      ['TagGroup', TYPES.VarChar, { nullable: true }],
      ['Time', TYPES.DateTime, { nullable: false }],
      ['dtYear', TYPES.SmallInt, { nullable: false }],
      ['dtDofY', TYPES.SmallInt, { nullable: false }],
      ['dtTotalS', TYPES.Int, { nullable: false }],
      ['Value', TYPES.Real, { nullable: true }],
    ];

    const rowCount = await db.insertBulkData(table, colums, data);
    if (isDebug && rowCount) logger.info(`Rows inserted to table "${table}": ${rowCount}`);

    //--- Commit transaction ---
    await db.commitTransaction();

    sql = `
    SELECT *
    FROM dbBSA.dbo.SnapShotTest AS sh
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
    if (isDebug && rows) inspector('Get values from dbBSA.dbo.SnapShotTest.rows:', rows);

    await db.disconnect();

  } catch (error) {
    //--- Rollback transaction ---
    await db.rollbackTransaction(error.message);
  }
};
module.exports = insertValues4ChAsoduDB;
