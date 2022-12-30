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
    const _debug = db.config.options.debug;
    _debug.data = true;
    _debug.packet = true;
    _debug.log = true;
    _debug.payload = true;
    _debug.token = true;
    db.config.events.connection.debug.enable = true;
    db.config.events.connection.infoMessage.enable = true;
    db.config.events.connection.errorMessage.enable = true;
    const connection = await db.connect();

    await db.disconnect();


    /**  
    var config = {
      server: 'BSA-HOME', // or "localhost" "'BSA-HOME\\SQLEXPRESS'"
      options: {
        // port: 1433,
        instanceName: 'SQLEXPRESS',
        encrypt: false,
        trustServerCertificate: false,
        database: 'dbBSA',
        connectTimeout: 5000,
      },
      debug: {
        data: true,
        packet: true,
        log: false,
        payload: false,
        token: false,
      },
      authentication: {
        type: 'default',
        options: {
          userName: 'sa',
          password: 'bs261257',
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
