/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  inspector,
  pause,
  startListenPort,
  stopListenPort,
  MssqlTedious,
  canTestRun,
  getPathBasename
} = require('../../src/plugins');

const { TYPES, Connection } = require('tedious');

const debug = require('debug')('app:mssql-tedious.test');
const isDebug = false;

const mssqlEnvName = 'MSSQL_BSAHOME_TEST';

describe('<<=== MSSQL-Tedious Test (mssql-tedious.test2.js) ===>>', () => {

  const isTest = canTestRun(getPathBasename(__filename));
  if (!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: Connecting and request', async () => {
    const db = new MssqlTedious(mssqlEnvName);
    const connection = await db.connect();

    // const params = [];
    // const sql = "select * from tblMessages where number = @number";
    // For each param do: db.buildParams(params, "name", TYPES.type, variable)
    // db.buildParams(params, "number", TYPES.Int, number);

    // const sql = 'select * from tblMessages';
    // await db.query(params, sql, result => {
    //   console.log('Request result:', { params, sql, rows: result });
    // });

    // if(isDebug) inspector('Connecting and request.getCurrentState:', db.getCurrentState());

    await db.disconnect();


    /** 
    var config = {
      server: 'BSA-HOME', // or "localhost" "'BSA-HOME\\SQLEXPRESS'"
      options: {
        // port: 1433,
        instanceName: 'SQLEXPRESS',
        encrypt: false,
        database: 'dbTest',
        connectTimeout: 5000,
      },
      authentication: {
        type: 'default',
        options: {
          userName: 'sa',
          password: 'sa123',
        }
      }
    };

    const connection = new Connection(config);

    // Setup event handler when the connection is established. 
    connection.on('connect', function (err) {
      if (err) {
        console.log('Error: ', err);
        return;
      }
      // If no error, then good to go...
      // executeStatement();
      console.log('Connect - OK');
    });

    // Initialize the connection.
    connection.connect();

    await pause(6000);

    */

    assert.ok(true, 'Connecting to the database (tedious)');
  });
});
