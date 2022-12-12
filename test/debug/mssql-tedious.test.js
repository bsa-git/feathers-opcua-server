/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const papa = require('papaparse');
const moment = require('moment');

const {
  appRoot,
  inspector,
  getRandomValue,
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
      const rows = await db.query([], 'SELECT * FROM tblMessages');
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
    let sql = '', rows;
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
    rows = await db.query(params, sql);
    if (isDebug && rows) inspector('Request result:', { sql, rows });
    await db.disconnect();

    const jsonRows = JSON.parse(rows[0]['text']);
    assert.deepStrictEqual(jsonRows, jsonData, 'Insert rows to table');
  });

  it('#3: Insert "CH_M52" rows to table', async () => {
    let sql = '', rows;
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
    rows = await db.query(params, sql);
    if (isDebug) inspector('Request result:', { sql, rows });
    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['Text']), jsonText, 'Insert rows to table');
  });

  it('#4: Update "CH_M51" value from table', async () => {
    let sql = '', rows;
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
    rows = await db.query(params, sql);
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
    const rows = await db.proc(params, sql);
    if (isDebug) inspector('Stored procedure result:', { sql, rows });
    // inspector('Stored procedure result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows[0].text, 'Execute Stored Procedure "dbo.MessagesSummary"');
  });

  it('#6: Select values for "webM51" from SnapShot table', async () => {
    let sql = '', rows;
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

    rows = await db.query(params, sql);
    if (isDebug) inspector('Request result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows.length, 'Select values for "webM51" from SnapShot table');
  });

  it('#7: Select values for "opcUPG2" from SnapShot table', async () => {
    let sql = '', rows;
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

    rows = await db.query(params, sql);
    if (isDebug && rows) inspector('Request result:', { sql, rows });

    await db.disconnect();

    assert.ok(rows.length, 'Select values for "opcUPG2" from SnapShot table');
  });

  it('#8: Add values to SnapShot table for "opcUA(A5)" and "XozUchet"', async () => {
    let sql = '', sql2 = '', rows, rowSnapShot = {}, rowsSnapShot = [];
    const scanerName = 'opcUA(A5)';
    const tagGroup = 'XozUchet';
    //---------------------------------------------
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    // Select rows from SnapShot table
    let params = [];
    sql = `
    SELECT tInfo.ID, tInfo.ScaleMin, tInfo.ScaleMax
    FROM dbConfig.dbo.TagsInfo AS tInfo
    WHERE tInfo.ScanerName = @scanerName AND tInfo.TagGroup = @tagGroup
    ORDER BY ID
    `;

    db.buildParams(params, 'scanerName', TYPES.Char, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.Char, tagGroup);

    rows = await db.query(params, sql);
    if (isDebug && rows) inspector('Get tags from TagsInfo.rows:', rows);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const dt = moment();
      let val = (row.ScaleMax - row.ScaleMin) / 2;
      val = getValue(val);

      rowSnapShot['TagID'] = row.ID;
      rowSnapShot['ScanerName'] = scanerName;
      rowSnapShot['Time'] = dt;
      rowSnapShot['dtYear'] = dt.year();
      rowSnapShot['dtDofY'] = dt.dayOfYear();
      rowSnapShot['dtTotalS'] = (dt.hours() * 60) + dt.seconds();
      rowSnapShot['Value'] = val;
    }
    if (isDebug && rowsSnapShot) inspector('Get tags from TagsInfo.rowsSnapShot:', rowSnapShot);

    // Remove rows from dbBSA.dbo.SnapShotTest
    await db.query([], 'DELETE FROM dbBSA.dbo.SnapShotTest');

    // Insert row to dbBSA.dbo.SnapShotTest
    params = [];
    sql = 'INSERT INTO dbBSA.dbo.SnapShotTest VALUES (@tagID, @scanerName, @time, @dtYear, @dtDofY, @dtTotalS, @value)';

    db.buildParams(params, 'tagID', TYPES.Int, rowSnapShot['TagID']);
    db.buildParams(params, 'scanerName', TYPES.Char, rowSnapShot['ScanerName']);
    db.buildParams(params, 'time', TYPES.DateTime, rowSnapShot['Time']);
    db.buildParams(params, 'dtYear', TYPES.SmallInt, rowSnapShot['dtYear']);
    db.buildParams(params, 'dtDofY', TYPES.SmallInt, rowSnapShot['dtDofY']);
    db.buildParams(params, 'dtTotalS', TYPES.Int, rowSnapShot['dtTotalS']);
    db.buildParams(params, 'value', TYPES.Real, rowSnapShot['Value']);
    await db.query(params, sql);

    sql2 = `
    SELECT sh.Value, sh.Time, sh.TagId, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
    FROM dbBSA.dbo.SnapShotTest AS sh
    JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
    WHERE (sh.ScanerName = @scanerName) AND (tInfo.TagGroup = @tagGroup) AND (tInfo.OnOff = 1)
    `;

    sql2 = `
    SELECT sh.TagId, sh.ScanerName, sh.Time, sh.dtYear, sh.dtDofY, sh.dtTotalS, sh.Value
    FROM dbBSA.dbo.SnapShotTest AS sh
    JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
    WHERE (sh.ScanerName = @scanerName) AND (tInfo.TagGroup = @tagGroup)
    `;

    params = [];
    db.buildParams(params, 'scanerName', TYPES.Char, scanerName);
    db.buildParams(params, 'tagGroup', TYPES.Char, tagGroup);

    rows = await db.query(params, sql2);
    rows[0]['Time'] = moment(rows[0]['Time']).format();
    if (true && rows) inspector('Get values from SnapShot.rows:', rows);



    await db.disconnect();

    assert.ok(rows, 'Select values for "opcUA(A5)" from TagsInfo table');
  });
});
