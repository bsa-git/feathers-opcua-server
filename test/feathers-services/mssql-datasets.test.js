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
} = require('../../src/plugins');

const debug = require('debug')('app:mssql-datasets.test');
const isDebug = false;

const mssqlEnvName = 'MSSQL_ASODU_TEST';
const db = new MssqlTedious(mssqlEnvName);

describe('<<=== MSSQL-Datasets Test (mssql-datasets.test.js) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: MSSQL datasets: registered the service', async () => {
    const service = app.service('mssql-datasets');
    assert.ok(service, 'MSSQL datasets: registered the service');
  });

  it('#2: MSSQL datasets: created the service', async () => {
    const service = app.service('mssql-datasets');
    // service create
    const mssqlDataset = await service.create({ config: db.config });
    if (isDebug) inspector('Created the service.mssqlDataset:', mssqlDataset.db.getCurrentState());
    assert.ok(mssqlDataset, 'MSSQL datasets: created the service');
  });

  it('#3: MSSQL datasets: db.query', async () => {
    const params = [];
    const sql = 'select * from tblMessages';
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const queryResult = await service.query(db.id, params, sql);
    if (isDebug) inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult.rows });
    assert.ok(queryResult, 'MSSQL datasets: db.query');
  });

  it('#4: MSSQL datasets: db.query', async () => {
    const params = [];
    const sql = 'select * from tblMessages';
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const data = {
      id: db.id,
      action: 'query',
      params,
      sql
    };
    const queryResult = await service.create(data);
    if (isDebug) inspector('MSSQL datasets: db.query:', { params, sql, rows: queryResult.rows });

    assert.ok(queryResult, 'MSSQL datasets: db.query');
  });

  it('#5: MSSQL datasets: service update', async () => {
    let _config = Object.assign({}, db.config);
    _config.events.connection.debug.enable = true;
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const result = await service.update(db.id, { config: _config });
    if (isDebug) inspector('MSSQL datasets: service update:', result);
    assert.ok(result, 'MSSQL datasets: service update');
  });

  it('#6: MSSQL datasets: service patch', async () => {
    const _config = { events: { connection: { debug: { enable: false } } } };
    //-----------------------------------------
    const service = app.service('mssql-datasets');
    const result = await service.patch(db.id, { config: _config });
    if (isDebug) inspector('MSSQL datasets: service patch:', result.db.getConnConfig());
    assert.ok(result, 'MSSQL datasets: service patch');
  });

  it('#7: MSSQL datasets: service remove', async () => {
    try {
      const service = app.service('mssql-datasets');
      let result = await service.remove(db.id);
      if (isDebug) inspector('MSSQL datasets: service remove:', result.db.currentState);
      // Check the availability of the service
      result = await service.get(db.id);
      assert.ok(false, 'MSSQL datasets: service remove');
    } catch (error) {
      assert.ok(true, 'MSSQL datasets: service remove');
    }
  });
});
