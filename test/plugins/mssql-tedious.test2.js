/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  inspector,
  startListenPort,
  stopListenPort,
  MssqlTedious,
  canTestRun,
  getPathBasename
} = require('../../src/plugins');

const { TYPES } = require('tedious');

const debug = require('debug')('app:mssql-tedious.test');
const isDebug = false;

const mssqlEnvName = 'MSSQL_BSAHOME_TEST';

describe('<<=== MSSQL-Tedious Test (mssql-tedious.test2.js) ===>>', () => {

  const isTest =  canTestRun(getPathBasename(__filename));
  if(!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('Connecting and request', async () => {
    const db = new MssqlTedious(mssqlEnvName);
    await db.connect();

    const params = [];
    // const sql = "select * from tblMessages where number = @number";
    // For each param do: db.buildParams(params, "name", TYPES.type, variable)
    // db.buildParams(params, "number", TYPES.Int, number);
    
    // const sql = 'select * from tblMessages';
    // await db.query(params, sql, result => {
    //   console.log('Request result:', { params, sql, rows: result });
    // });

    // if(isDebug) inspector('Connecting and request.getCurrentState:', db.getCurrentState());

    await db.disconnect();

    assert.ok(true, 'Connecting to the database (tedious)');
  });
});
