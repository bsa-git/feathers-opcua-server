/* eslint-disable no-unused-vars */
const assert = require('assert');
const { TYPES } = require('tedious');
// const { config } = require('winston');
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

const debug = require('debug')('app:mssql-datasets.test');

const isDebug = false;
const isLog = false;

let config = MssqlTedious.getDefaultConnConfig();
config = getMssqlConfigFromEnv(config, 'MSSQL_ASODU_TEST');
const id = getIdFromMssqlConfig(config);

describe('<<=== MSSQL-Datasets Test (mssql-datasets.test.js) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

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
    const mssqlDataset = await service.create({ config });
    if (isLog) inspector('Created the service.mssqlDataset:', mssqlDataset.db.getCurrentState());
    // inspector('Created the service.mssqlDataset:', mssqlDataset.db.getCurrentState());
    assert.ok(mssqlDataset, 'MSSQL datasets: created the service');
  });

  it('MSSQL datasets: db.query', async () => {
    const params = [];
    const sql = 'select * from tblMessages';
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const queryResult = await service.query(id, params, sql);
    if (isLog) inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult });

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
    if (isLog) inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult });

    assert.ok(queryResult, 'MSSQL datasets: db.query');
  });

  it('MSSQL datasets: service update', async () => {
    let _config = Object.assign({}, config);
    _config.events.connection.debug.enable = true;
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const result = await service.update(id, { config: _config });
    if (isLog) inspector('MSSQL datasets: service update:', result);
    // inspector('MSSQL datasets: service update:', result.db.getCurrentState());
    assert.ok(result, 'MSSQL datasets: service update');
  });

  it('MSSQL datasets: service patch', async () => {
    const _config = { events: { connection: { debug: { enable: false } } } };
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const result = await service.patch(id, { config: _config });
    if (isLog) inspector('MSSQL datasets: service patch:', result.db.getConnConfig());
    // inspector('MSSQL datasets: service patch:', result.db.getConnConfig());
    assert.ok(result, 'MSSQL datasets: service patch');
  });

  it('MSSQL datasets: service remove', async () => {
    try {
      const service = app.service('mssql-datasets');
      let result = await service.remove(id);
      if (isLog) inspector('MSSQL datasets: service remove:', result.db.currentState);
      // inspector('MSSQL datasets: service remove:', result.db.currentState);
      // Check the availability of the service
      result = await service.get(id);
      assert.ok(false, 'MSSQL datasets: service remove');
    } catch (error) {
      assert.ok(true, 'MSSQL datasets: service remove');
    }
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
