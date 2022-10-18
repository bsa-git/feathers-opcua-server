/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const papa = require('papaparse');

const {
  appRoot,
  inspector,
  startListenPort,
  stopListenPort,
  MssqlTedious,
  canTestRun,
  getPathBasename,
  getMssqlConfigFromEnv,
  readFileSync
} = require('../../src/plugins');

const { TYPES } = require('tedious');
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

const debug = require('debug')('app:mssql-tedious.test');

const isDebug = false;

let config = MssqlTedious.getDefaultConnConfig();
config = getMssqlConfigFromEnv(config, 'MSSQL_ASODU_TEST');
if (isDebug) inspector('getMssqlConfigFromEnv.config:', config);

const id = 'ua-cherkassy-azot-asutp_dev1';

//===============================================================

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
  csv = readFileSync([appRoot, '/src/api/opcua', id, fileName]);
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

  it('#1: Delete rows from table', async () => {
    const db = new MssqlTedious(config);
    await db.connect();
    await db.query([], 'DELETE FROM dbo.tblMessages');
    const rows = await db.query([], 'SELECT * FROM tblMessages');
    if(isDebug) inspector('Delete result:', { rows });
    await db.disconnect();

    assert.ok(!rows.length, 'Delete rows from table');
  });

  
  it('#2: Insert "CH_M51" rows to table', async () => {
    let sql = '', rows;
    //---------------------------------------------
    const db = new MssqlTedious(config);
    await db.connect();

    // Insert row to tblMessages
    let params = [];
    sql = 'INSERT INTO dbo.tblMessages VALUES (@value, @type, @text)';
    const jsonText = getData('data-CH_M51.csv');
    if(isDebug) inspector('getData:', jsonText);
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'text', TYPES.Char, JSON.stringify(jsonText));
    await db.query(params, sql);

    // Select rows from tblMessages
    params = [];
    sql = 'SELECT @text = Text FROM dbo.tblMessages WHERE Type = @type AND Value = @value';
    // For each param do: db.buildParams(params, "name", TYPES.type, variable)
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    db.buildParams(params, 'text', TYPES.Char, null, true);
    rows = await db.query(params, sql);
    if(isDebug) inspector('Request result:', { sql, rows });
    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['text']), jsonText, 'Insert rows to table');
  });

  it('#3: Insert "CH_M52" rows to table', async () => {
    let sql = '', rows;
    //---------------------------------------------
    const db = new MssqlTedious(config);
    await db.connect();

    // Insert row to tblMessages
    let params = [];
    sql = 'INSERT INTO dbo.tblMessages VALUES (@value, @type, @text)';
    const jsonText = getData('data-CH_M52.csv');
    if(isDebug) inspector('getData:', jsonText);
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
    if(isDebug) inspector('Request result:', { sql, rows });
    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['Text']), jsonText, 'Insert rows to table');
  });

  it('#4: Update "CH_M51" value from table', async () => {
    let sql = '', rows;
    //---------------------------------------------
    const db = new MssqlTedious(config);
    await db.connect();

    // Update text from tblMessages
    let params = [];
    sql = 'UPDATE dbo.tblMessages SET Text = @text WHERE Type = @type AND Value = @value';
    const jsonText = getData('data-CH_M51.csv');
    if(isDebug) inspector('getData:', jsonText);
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
    if(isDebug) inspector('Request result:', { sql, rows });
    
    await db.disconnect();

    assert.deepStrictEqual(JSON.parse(rows[0]['Text']), jsonText, 'Update value from table');
  });

  
  it('#5: Execute Stored Procedure "dbo.MessagesSummary"', async () => {
    let sql = '';
    //---------------------------------------------
    const db = new MssqlTedious(config);
    await db.connect();

    // Select rows from tblMessages
    const params = [];
    sql = 'dbo.MessagesSummary';
    db.buildParams(params, 'type', TYPES.Char, 'tag');
    db.buildParams(params, 'value', TYPES.Char, 'CH_M51::ValueFromFile');
    db.buildParams(params, 'text', TYPES.Char, null, true);
    // db.buildParams(params, '@text', TYPES.Char, '');
    const rows = await db.proc(params, sql);
    if(isDebug) inspector('Stored procedure result:', { sql, rows });
    // inspector('Stored procedure result:', { sql, rows });
    
    await db.disconnect();

    assert.ok(rows[0].text, 'Execute Stored Procedure "dbo.MessagesSummary"');
  });
  
  it('#6: Select values for "webM51" from SnapShot table', async () => {
    let sql = '', rows;
    //---------------------------------------------
    const db = new MssqlTedious(config);
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
    if(isDebug) inspector('Request result:', { sql, rows });
    
    await db.disconnect();

    assert.ok(rows.length, 'Select values for "webM51" from SnapShot table');
  });

  it('#7: Select values for "opcUPG2" from SnapShot table', async () => {
    let sql = '', rows;
    //---------------------------------------------
    const db = new MssqlTedious(config);
    await db.connect();

    // Select rows from SnapShot table
    const params = [];
    sql = `
    SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
    FROM dbMonitor.dbo.SnapShot AS sh
    JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
    WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
    `;
    db.buildParams(params, 'scanerName', TYPES.Char, 'opcUPG2');
    
    rows = await db.query(params, sql);
    if(isDebug) inspector('Request result:', { sql, rows });
    
    await db.disconnect();

    assert.ok(rows.length, 'Select values for "opcUPG2" from SnapShot table');
  });
  
});
