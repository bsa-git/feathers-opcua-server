/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {
  inspector,
  startListenPort,
  stopListenPort,
  MssqlTedious,
  canTestRun,
  getPathBasename,
  getMssqlConfigFromEnv,
  getIdFromMssqlConfig
} = require('../../src/plugins');
const { TYPES } = require('tedious');

const debug = require('debug')('app:mssql-datasets.test');

const isDebug = false;
const isLog = false;

let config = MssqlTedious.getConnConfig();
config = getMssqlConfigFromEnv(config, 'MSSQL_ASODU_TEST');
const id = getIdFromMssqlConfig(config);

describe('<<=== MSSQL-Datasets Test (mssql-datasets.test.js) ===>>', () => {

  const isTest =  canTestRun(getPathBasename(__filename));
  // debug('MSSQL-Tedious Test.isTest:', isTest);
  if(!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('MSSQL datasets: registered the service', async () => {
    const service = app.service('mssql-datasets');
    assert.ok(service, 'MSSQL datasets: registered the service');
  });

  it('MSSQL datasets: created the service', async () => {
    const service = app.service('mssql-datasets');
    // service create
    const mssqlDataset = await service.create({config});
    if (isLog) inspector('Created the service.mssqlDataset:', mssqlDataset.db.getCurrentState());
    inspector('Created the service.mssqlDataset:', mssqlDataset.db.getCurrentState());
    assert.ok(mssqlDataset, 'MSSQL datasets: created the service');
  });

  it('MSSQL datasets: db.query', async () => {
    const params = [];
    const sql = 'select * from tblMessages';
    //-----------------------------------------
    const service = app.service('mssql-datasets');    
    const queryResult = await service.query(id, params, sql);
    inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult });
    // await service.disconnect(id);

    assert.ok(queryResult, 'MSSQL datasets: db.query');
  });

  it('MSSQL datasets: db.query', async () => {
    const params = [];
    const sql = 'select * from tblMessages';
    //-----------------------------------------
    const service = app.service('mssql-datasets'); 
    const data = {
      id, 
      action: 'query',
      params, 
      sql
    };   
    const queryResult = await service.create(data);
    inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult });
    // await service.disconnect(id);

    assert.ok(queryResult, 'MSSQL datasets: db.query');
  });

  /*
  it('Connecting and request', async () => {
    const db = new MssqlTedious(config);
    await db.connect();

    const params = [];
    // const sql = "select * from tblMessages where number = @number";
    const sql = 'select * from tblMessages';
    // For each param do: db.buildParams(params, "name", TYPES.type, variable)
    // db.buildParams(params, "number", TYPES.Int, number);
    await db.query(params, sql, result => {
      console.log('Request result:', { params, sql, rows: result });
    });

    if(isLog) inspector('Connecting and request.getCurrentState:', db.getCurrentState());

    await db.connDisconnect();

    assert.ok(true, 'Connecting to the database (tedious)');
  });
  */
});
