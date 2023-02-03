/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const papa = require('papaparse');
const moment = require('moment');
const chalk = require('chalk');

const {
  appRoot,
  inspector,
  logger,
  Queue,
  startListenPort,
  stopListenPort,
  MssqlTedious,
  canTestRun,
  getPathBasename,
  readFileSync
} = require('../../src/plugins');

const { TYPES } = require('tedious');
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const { pause } = require('../../src/plugins/lib/util');

const debug = require('debug')('app:mssql-tedious.test');
const isDebug = false;

const mssqlEnvName = 'MSSQL_ASODU_TEST';

//=============================================================

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
 * @method getData
 * @param {String} fileName 
 * @returns {String}
 */
const getData = function (fileName) {
  let csv = '', json = '';
  csv = readFileSync([appRoot, '/test/data/csv', fileName]);
  if (csv) {
    const results = papa.parse(csv, { delimiter: ';', header: true });
    json = results.data[0];
    loForEach(json, function (value, key) {
      json[key] = getValue(value);
    });
    if (isDebug) inspector('getData.json:', json);
  }
  return json;
};

const insertData = async function () {
  let sql = '';
  //---------------------------------------------
  const db = new MssqlTedious(mssqlEnvName);
  await db.connect();

  // Insert row to tblMessages
  let params = [];
  sql = 'INSERT INTO dbo.tblMessages VALUES (@value, @type, @text)';
  const jsonData = getData('data-CH_M51.csv');
  if (isDebug && jsonData) inspector('getData:', jsonData);
  db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
  db.buildParams(params, 'type', TYPES.Char, 'tag');
  db.buildParams(params, 'text', TYPES.Char, JSON.stringify(jsonData));
  await db.query(params, sql);

  // Select rows from tblMessages
  params = [];
  sql = 'SELECT @text = Text FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
  // For each param do: db.buildParams(params, "name", TYPES.type, variable)
  db.buildParams(params, 'type', TYPES.Char, 'tag');
  db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
  db.buildParams(params, 'text', TYPES.Char, null, true);
  const { rows } = await db.query(params, sql);
  if (isDebug && rows) inspector('Request result:', { sql, rows });
  await db.disconnect();

  const jsonRows = JSON.parse(rows[0]['text']);
  return { jsonRows, jsonData };
};

describe('<<=== MSSQL-Tedious Test (mssql-tedious.test.js) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: Delete rows from table with transactions', async () => {
    let db;
    try {
      db = new MssqlTedious(mssqlEnvName);
      await db.connect();

      // Begin transaction      
      await db.beginTransaction();

      await db.query([], 'DELETE FROM dbo.tblMessages');
      const { rows } = await db.query([], 'SELECT * FROM tblMessages');
      if (isDebug && rows) inspector('Delete result:', { rows });

      // Commit transaction      
      await db.commitTransaction();
      await db.disconnect();
      assert.ok(!rows.length, 'Delete rows from table with transactions');
    } catch (error) {
      // Rollback transaction      
      await db.rollbackTransaction(error.message);
      assert.ok(false, 'Delete rows from table with transactions');
    }
  });


  it('#2: Insert "CH_M51" rows to table', async () => {
    let result = null;
    //---------------------------------------------
    result = await insertData();
    assert.deepStrictEqual(result.jsonRows, result.jsonData, 'Insert rows to table');
  });

  it('#3: Insert "CH_M52" rows to table', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Insert row to tblMessages
    let params = [];
    sql = 'INSERT INTO dbo.tblMessages VALUES (@value, @type, @text)';
    const jsonText = getData('data-CH_M52.csv');
    if (isDebug) inspector('getData:', jsonText);
    db.buildParams(params, 'value', TYPES.Char, 'CH_M52::ValueFromFile');
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'text', TYPES.Char, JSON.stringify(jsonText));
    await db.query(params, sql);

    // Select rows from tblMessages
    params = [];
    sql = 'SELECT * FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
    // For each param do: db.buildParams(params, "name", TYPES.type, variable)
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'value', TYPES.Char, 'CH_M52::ValueFromFile');
    const { rows } = await db.query(params, sql);
    if (isDebug) inspector('Request result:', { sql, rows });
    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['Text']), jsonText, 'Insert rows to table');
  });

  it('#4: Update "CH_M51" value from table', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Update text from tblMessages
    let params = [];
    sql = 'UPDATE dbo.tblMessages SET Text = @text WHERE Type = @type AND Value = @value';
    const jsonText = getData('data-CH_M51.csv');
    if (isDebug) inspector('getData:', jsonText);
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'text', TYPES.Char, JSON.stringify(jsonText));
    await db.query(params, sql);

    // Select rows from tblMessages
    params = [];
    sql = 'SELECT * FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    const { rows } = await db.query(params, sql);
    if (isDebug) inspector('Request result:', { sql, rows });

    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['Text']), jsonText, 'Update value from table');
  });


  it('#5: Execute Stored Procedure "dbo.MessagesSummary"', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Select rows from tblMessages
    const params = [];
    sql = 'dbo.MessagesSummary';
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    db.buildParams(params, 'text', TYPES.Char, null, true);
    // db.buildParams(params, '@text', TYPES.Char, '');
    const { rows } = await db.proc(params, sql);
    if (isDebug) inspector('Stored procedure result:', { sql, rows });
    // inspector('Stored procedure result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows[0].text, 'Execute Stored Procedure "dbo.MessagesSummary"');
  });

  it('#6: Select values for "webM51" from SnapShot table', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Select rows from SnapShot table
    const params = [];
    sql = `
    SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
    FROM dbMonitor.dbo.SnapShot AS sh
    JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
    WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
    `;
    db.buildParams(params, 'scanerName', TYPES.Char, 'webM51');

    const { rows } = await db.query(params, sql);
    if (isDebug) inspector('Request result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows.length, 'Select values for "webM51" from SnapShot table');
  });

  it('#7: Select values for "opcUPG2" from SnapShot table', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Select rows from SnapShot table
    const params = [];
    sql = `
    SELECT sh.Value, sh.Time, sh.TagId, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
    FROM dbMonitor.dbo.SnapShot AS sh
    JOIN dbConfig.dbo.TagsInfo AS tInfo ON (sh.TagID = tInfo.ID)
    WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
    `;
    db.buildParams(params, 'scanerName', TYPES.Char, 'opcUPG2');

    const { rows } = await db.query(params, sql);
    if (isDebug && rows) inspector('Request result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows.length, 'Select values for "opcUPG2" from SnapShot table');
  });

  it('#8: Insert values with insertBulkData to SnapShotTest table for "XozUchet(A5)"', async () => {
    let db, sql = '', result, rows, rowSnapShot = {}, rowsSnapShot = [];
    const scanerName = 'XozUchet(A5)';// 'XozUchetDay(A5)'
    //---------------------------------------------

    try {
      db = new MssqlTedious(mssqlEnvName);
      await db.connect();

      //--- Begin transaction ---
      await db.beginTransaction();

      // Select rows from TagsInfo table
      let params = [];

      sql = `
      SELECT tInfo.ID, tInfo.ScaleMin, tInfo.ScaleMax
      FROM dbConfig.dbo.TagsInfo AS tInfo
      WHERE tInfo.ScanerName = @scanerName
      ORDER BY ID
      `;

      db.buildParams(params, 'scanerName', TYPES.Char, scanerName);

      result = await db.query(params, sql);
      rows = result.rows;
      if (isDebug && rows) inspector('Get tags from TagsInfo.rows:', rows);

      for (let index = 0; index < rows.length; index++) {
        rowSnapShot = {};
        const row = rows[index];
        const dt = moment();
        let val = (row.ScaleMax - row.ScaleMin) / 2;
        val = getValue(val);

        rowSnapShot['TagID'] = row.ID;
        rowSnapShot['ScanerName'] = scanerName;
        rowSnapShot['Time'] = dt.format('YYYY-MM-DDTHH:mm:ss');
        rowSnapShot['dtYear'] = dt.year();
        rowSnapShot['dtDofY'] = dt.dayOfYear();
        rowSnapShot['dtTotalS'] = (dt.hours() * 3600) + dt.seconds();
        rowSnapShot['Value'] = val;

        rowsSnapShot.push(rowSnapShot);
      }
      if (isDebug && rowsSnapShot.length) inspector('Get tags from TagsInfo.rowsSnapShot:', rowsSnapShot);

      // Remove rows from dbBSA.dbo.SnapShotTest
      sql = `
      DELETE sh FROM dbBSA.dbo.SnapShotTest AS sh
      WHERE (sh.ScanerName = @scanerName)
      `;
      params = [];
      db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);

      result = await db.query(params, sql);
      if (isDebug && result) inspector('Delete rows from dbBSA.dbo.SnapShotTest:', result.rowCount);

      // Insert row to dbBSA.dbo.SnapShotTest
      const table = 'dbBSA.dbo.SnapShotTest';
      const colums = [
        ['TagID', TYPES.Int, { nullable: false }],
        ['ScanerName', TYPES.VarChar, { nullable: false }],
        ['Time', TYPES.DateTime, { nullable: false }],
        ['dtYear', TYPES.SmallInt, { nullable: false }],
        ['dtDofY', TYPES.SmallInt, { nullable: false }],
        ['dtTotalS', TYPES.Int, { nullable: false }],
        ['Value', TYPES.Real, { nullable: true }],
      ];

      const rowCount = await db.insertBulkData(table, colums, rowsSnapShot);
      if (isDebug && rowCount) logger.info(`Rows inserted to table "${table}": ${rowCount}`);

      sql = `
      SELECT *
      FROM dbBSA.dbo.SnapShotTest AS sh
      WHERE (sh.ScanerName = @scanerName)
      `;

      params = [];
      db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);

      result = await db.query(params, sql);
      rows = result.rows;
      if (isDebug && rows) inspector('Get values from dbBSA.dbo.SnapShotTest.rows:', rows);

      //--- Commit transaction ---
      await db.commitTransaction();
      await db.disconnect();

      assert.ok(rows.length, 'Insert values to SnapShot table for "opcUA(A5)" and "XozUchet"');
    } catch (error) {
      //--- Rollback transaction ---
      if(db.connection) await db.rollbackTransaction(error.message);
      assert.ok(false, 'Insert values to SnapShot table for "opcUA(A5)" and "XozUchet"');
    }
  });


  it('#9: Insert values with params to SnapShotTest table for "XozUchetDay(A5)"', async () => {
    let db, sql = '', result, rows, rowSnapShot = {}, rowsSnapShot = [];
    let params, tScanSS = false;
    const scanerName = 'XozUchetDay(A5)';// 'XozUchet(A5)';
    //---------------------------------------------

    try {
      db = new MssqlTedious(mssqlEnvName);
      await db.connect();

      //--- Begin transaction ---
      await db.beginTransaction();

      // Get dbConfig.dbo.Scaners.SS from Scaners table
      params = [];
      sql = `
      SELECT tScan.SS
      FROM dbConfig.dbo.Scaners AS tScan
      WHERE tScan.Name = @scanerName
      `;
      db.buildParams(params, 'scanerName', TYPES.Char, scanerName);

      result = await db.query(params, sql);
      rows = result.rows;
      if(rows.length) tScanSS = rows[0]['SS'];
      if (isDebug && rows) logger.info('Get dbConfig.dbo.Scaners.SS: %d', tScanSS);

      // Select rows from SnapShot table
      params = [];
      if(tScanSS){
        sql = `
        SELECT tInfo.ID, tInfo.ScaleMin, tInfo.ScaleMax
        FROM dbConfig.dbo.TagsInfo AS tInfo
        JOIN dbConfig.dbo.Scaners AS tScan ON (tScan.Name = tInfo.ScanerName)
        WHERE tInfo.ScanerName = @scanerName AND tInfo.OnOff = 1 AND tScan.SS = 1
        ORDER BY ID
        `;
      } else {
        sql = `
        SELECT tInfo.ID, tInfo.ScaleMin, tInfo.ScaleMax
        FROM dbConfig.dbo.TagsInfo AS tInfo
        WHERE tInfo.ScanerName = @scanerName AND tInfo.OnOff = 1
        ORDER BY ID
        `;
      }

      db.buildParams(params, 'scanerName', TYPES.Char, scanerName);

      result = await db.query(params, sql);
      rows = result.rows;
      if (isDebug && rows) inspector('Get tags from TagsInfo.rows:', rows);

      for (let index = 0; index < rows.length; index++) {
        rowSnapShot = {};
        const row = rows[index];
        const dt = moment();
        let val = (row.ScaleMax - row.ScaleMin) / 2;
        val = getValue(val);

        rowSnapShot['TagID'] = row.ID;
        rowSnapShot['ScanerName'] = scanerName;
        rowSnapShot['Time'] = dt.format('YYYY-MM-DDTHH:mm:ss');
        rowSnapShot['dtYear'] = dt.year();
        rowSnapShot['dtDofY'] = dt.dayOfYear();
        rowSnapShot['dtTotalS'] = (dt.hours() * 3600) + dt.seconds();
        rowSnapShot['Value'] = val;

        rowsSnapShot.push(rowSnapShot);
      }
      if (isDebug && rowsSnapShot.length) inspector('Get tags from TagsInfo.rowsSnapShot:', rowsSnapShot);

      // Remove rows from dbBSA.dbo.SnapShotTest
      sql = `
      DELETE sh FROM dbBSA.dbo.SnapShotTest AS sh
      WHERE (sh.ScanerName = @scanerName)
      `;
      params = [];
      db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);

      result = await db.query(params, sql);
      if (isDebug && result) inspector('Delete rows from dbBSA.dbo.SnapShotTest:', result.rowCount);

      // Insert row to dbBSA.dbo.SnapShotTest
      for (let index = 0; index < rowsSnapShot.length; index++) {
        params = [];
        const _rowSnapShot = rowsSnapShot[index];
        sql = `
        INSERT INTO dbBSA.dbo.SnapShotTest 
        (TagID, ScanerName, Time, dtYear, dtDofY, dtTotalS, Value)
        VALUES (@tagID, @scanerName, '${_rowSnapShot['Time']}', @dtYear, @dtDofY, @dtTotalS, @value)
        `;

        db.buildParams(params, 'tagID', TYPES.Int, _rowSnapShot['TagID']);
        db.buildParams(params, 'scanerName', TYPES.VarChar, _rowSnapShot['ScanerName']);
        db.buildParams(params, 'dtYear', TYPES.SmallInt, _rowSnapShot['dtYear']);
        db.buildParams(params, 'dtDofY', TYPES.SmallInt, _rowSnapShot['dtDofY']);
        db.buildParams(params, 'dtTotalS', TYPES.Int, _rowSnapShot['dtTotalS']);
        db.buildParams(params, 'value', TYPES.Real, _rowSnapShot['Value']);
        // Run query
        result = await db.query(params, sql);
        if (isDebug && result) inspector('INSERT rows to dbBSA.dbo.SnapShotTest:', result.rowCount);
      }

      sql = `
      SELECT *
      FROM dbBSA.dbo.SnapShotTest AS sh
      WHERE (sh.ScanerName = @scanerName)
      `;

      params = [];
      db.buildParams(params, 'scanerName', TYPES.VarChar, scanerName);

      result = await db.query(params, sql);
      rows = result.rows;
      if (isDebug && rows) inspector('Get values from dbBSA.dbo.SnapShotTest.rows:', rows);

      //--- Commit transaction ---
      await db.commitTransaction();
      await db.disconnect();

      assert.ok(rows.length, 'Values don`t insert to SnapShot table for "XozUchetDay(A5)"');
    } catch (error) {
      //--- Rollback transaction ---
      if(db.connection) await db.rollbackTransaction(error.message);
      assert.ok(false, 'Insert values to SnapShot table for "XozUchetDay(A5)"');
    }
  });

  it('#10: Insert data to table with queue', async () => {
    let result = null;
    //---------------------------------------------
    
    // Clear queue
    Queue.clearQueue();

    // Set interval_1
    const intervalId_1 = setInterval(async function () {
      try {
        const queue = new Queue('intervalId_1', 'mssql-list');
        await queue.doWhile();
        if(isDebug && queue) console.log('TimeDuration1_1:', queue.timeDuration);
        result = await insertData();
        assert.deepStrictEqual(result.jsonRows, result.jsonData, 'Insert data to table with queue');
        queue.dropCurrentItem();
        if (isDebug && result) console.log('TimeDuration1_2:', queue.getTimeDuration());
      } catch (error) {
        const errorMessage = error.message? error.message : error;
        logger.error(`Insert data to table with queue.Error: "${errorMessage}"`);
      }
    }, 2000);

    // Set interval_2
    const intervalId_2 = setInterval(async function () {
      try {
        const queue = new Queue('intervalId_2', 'mssql-list');
        await queue.doWhile();
        if(isDebug && queue) console.log('TimeDuration2_1:', queue.timeDuration);
        result = await insertData();
        assert.deepStrictEqual(result.jsonRows, result.jsonData, 'Insert data to table with queue');
        queue.dropCurrentItem();
        if (isDebug && result) console.log('TimeDuration2_2:', queue.getTimeDuration());
      } catch (error) {
        const errorMessage = error.message? error.message : error;
        logger.error(`Insert data to table with queue.Error: "${errorMessage}"`);
      }
    }, 2000);

    await pause(10000);

    // Clear intervals
    clearInterval(intervalId_1);
    clearInterval(intervalId_2);


  });
});
