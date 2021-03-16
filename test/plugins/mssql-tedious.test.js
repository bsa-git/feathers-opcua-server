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
} = require('../../src/plugins');
const { TYPES } = require('tedious');

const debug = require('debug')('app:mssql-tedious.class');

const isDebug = false;
const isLog = false;


// 'dbBSA', 'bsa_u', 'bs@U$21' 'bs%40U%2421' 'OGMT-MZTP\\FIRST' ostchem.com.ua 10.60.0.49  
const config = {
  connection: {
    server: 'OGMT-MZTP',
    options: {
      instanceName: 'FIRST',
      database: 'dbBSA',
      debug: {
        data: false,
        packet: false,
        log: false,
        payload: false,
        token: false,
      }
    },
    authentication: {
      options: {
        userName: 'bsa_u',
        password: 'bs@U$21',
      }
    },
    events: {
      connection: {
        debug: {
          enable: false,
          // cb: this.onDebugForConn
        },
        infoMessage: {
          enable: false,
          // cb: this.onInfoMessageForConn
        },
        errorMessage: {
          enable: false,
          // cb: this.onErrorMessageForConn
        },
        databaseChange: {
          enable: false,
          // cb: this.onDatabaseChangeForConn
        },
        languageChange: {
          enable: false,
          // cb: this.onLanguageChangeForConn
        },
        charsetChange: {
          enable: false,
          // cb: this.onCharsetChangeForConn
        },
        secure: {
          enable: false,
          // cb: this.onSecureForConn
        },
      },
      request: {
        columnMetadata: {
          enable: false,
          // cb: this.onColumnMetadataForRequest
        },
        prepared: {
          enable: false,
          // cb: this.onPreparedForRequest
        },
        error: {
          enable: false,
          // cb: this.onErrorForRequest
        },
        requestCompleted: {
          enable: false,
          // cb: this.onRequestCompletedForRequest
        },
        done: {
          enable: false,
          // cb: this.onDoneForRequest
        },
        returnValue: {
          enable: false,
          // cb: this.onReturnValueForRequest
        },
        order: {
          enable: false,
          // cb: this.onOrderForRequest
        }
      }
    }
  }
};

describe('<<=== MSSQL-Tedious Test ===>>', async () => {

  // const isTest =  await canTestRun(getPathBasename(__filename));
  // debug('MSSQL-Tedious Test.isTest:', isTest);
  // if(!isTest) return;

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

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
});
