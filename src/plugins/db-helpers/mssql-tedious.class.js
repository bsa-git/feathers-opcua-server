/* eslint-disable no-unused-vars */
const loMerge = require('lodash/merge');
const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');
const { Connection, Request, TYPES } = require('tedious');

const {
  logger,
  assert,
  inspector,
  isFunction,
  isObject,
  getInt
} = require('../lib');

const queryFuncs = require('./lib');

const debug = require('debug')('app:mssql-tedious.class');

const isDebug = false;

const defaultConnConfig = {
  server: 'server',
  options: {
    instanceName: 'instanceName',
    encrypt: false,
    trustServerCertificate: false,
    truestedConnection: true,
    database: 'database',
    connectTimeout: 20000,
    rowCollectionOnDone: true, // Only get row set instead of row by row
    useColumnNames: true, // For easier JSON formatting
    debug: {
      data: false,
      packet: false,
      log: false,
      payload: false,
      token: false,
    }
  },
  authentication: {
    type: 'default',
    options: {
      userName: 'userName',
      password: 'password',
      domain: ''
    }
  },
  events: {
    connection: {
      debug: {
        enable: false
      },
      infoMessage: {
        enable: false
      },
      errorMessage: {
        enable: false
      },
      databaseChange: {
        enable: false
      },
      languageChange: {
        enable: false
      },
      charsetChange: {
        enable: false
      },
      secure: {
        enable: false
      },
    },
    request: {
      columnMetadata: {
        enable: false
      },
      prepared: {
        enable: false
      },
      error: {
        enable: false
      },
      requestCompleted: {
        enable: false
      },
      done: {
        enable: false
      },
      returnValue: {
        enable: false
      },
      order: {
        enable: false
      }
    }
  }
};

class MssqlTedious {
  /**
   * Constructor
   * @param {Object|String} config
   * e.g. 'MSSQL_BSAHOME_TEST' | { server: 'server',..., }
   */
  constructor(config) {
    this.config = MssqlTedious.getConfig(config);
    this.id = MssqlTedious.getIdFromConfig(this.config);
    this.connection = null;
    this.currentState = {
      id: this.id,
      connectionConfig: this.getConnConfigForCurrentState(),
      connError: '',
      requestError: '',
      isConnected: false,
      isConnCanceled: false,
      isConnReset: false,
      isBeginTransaction: false,
      isCommitTransaction: false,
      isRollbackTransaction: false
    };
  }

  /**
   * @method getConnConfig
   * @static
   * 
   * @returns {Object}
   */
  static getDefaultConnConfig() {
    return defaultConnConfig;
  }

  /**
 * @method getIdFromConfig
 * @param {Object|String} config
 * e.g. 'MSSQL_BSAHOME_TEST' | { server: 'server',..., } 
 * @returns {String}
 */
  static getIdFromConfig(config) {
    let _config;
    //----------------------------
    _config = MssqlTedious.getConfig(config);

    const id = _config.server +
      `${_config.options.instanceName ? '.' + _config.options.instanceName : ''}` +
      `.${_config.options.database}`;
    return id;
  }



  /**
 * @method getConfigFromEnv
 * @param {Object} config 
 * @param {String} prefix 
 * @returns {Object}
 */
  static getConfigFromEnv(config, prefix) {
    let idParts = [], envPort, defaultPort = 1433, server = '', instanceName = '', database = '';
    //---------------------------------------------------------------
    let _config = loMerge({}, config);
    const id = process.env[`${prefix}_ID`];
    assert(id, `getConfigFromEnv.Error of id="${id}", prefix="${prefix}"`);
    const user = process.env[`${prefix}_USER`];
    const pass = process.env[`${prefix}_PASS`];
    envPort = process.env[`${prefix}_PORT`];
    envPort = envPort ? getInt(envPort) : 0;
    idParts = id.split('.');
    if (idParts.length === 3) {
      server = idParts[0];
      instanceName = idParts[1];
      database = idParts[2];
      _config.options.instanceName = instanceName;
    } else {
      _config = loOmit(_config, ['options.instanceName']);
      server = idParts[0];
      database = idParts[1];
      envPort = envPort ? envPort : defaultPort;
      _config.options.port = envPort;
    }

    _config.server = server;
    _config.options.database = database;
    _config.authentication.options.userName = user;
    _config.authentication.options.password = pass;
    if (isDebug && _config) inspector('getConfigFromEnv._config:', _config);
    return _config;
  }

  /**
 * @method getConfig
 * @param {Object|String} config
 * e.g. 'MSSQL_BSAHOME_TEST' | { server: 'server',..., } 
 * @returns {Object}
 */
  static getConfig(config) {
    let _config;
    //----------------------------
    if (isObject(config)) {
      _config = Object.assign({}, config);
    } else {
      _config = MssqlTedious.getDefaultConnConfig();
      _config = MssqlTedious.getConfigFromEnv(_config, config);
    }
    return _config;
  }

  /**
   * @method getConnConfig
   * 
   * @returns {Object}
   */
  getConnConfig() {
    return loOmit(this.config, ['authentication.options.password']);
  }

  /**
   * @method getCurrentState
   * @returns {Object}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * @method getConnConfigForCurrentState
   * 
   * @returns {Object}
   */
  getConnConfigForCurrentState() {
    return loOmit(this.config, ['options.debug', 'authentication.options.password', 'events']);
  }

  /**
 * @method getDatasetForProvider
 * @returns {Object}
 */
  getDatasetForProvider() {
    return {
      db: {
        currentState: this.getCurrentState()
      }
    };
  }

  /**
 * @method isDatasetInList
 * @param {Object} service 
 * @returns {Boolean}
 */
  isDatasetInList(service) {
    const mssqlDataset = service.mssqlDatasets.find(obj => obj.id === this.id);
    return !!mssqlDataset;
  }

  /**
 * @async
 * @method executeQuery
 * @param {String} queryFunc 
 * e.g. queryFunc = 'getTagInfoFromChAsoduDB' 
 * @param {Object} queryParams 
 * e.g. queryParams = { "scanerName": "opcUA(A5)", "tagGroup": "XozUchet" }
 * @returns {Object}
 */
  async executeQuery(queryFunc, queryParams) {
    let rows;
    //-------------------------------
    // Select values from DB
    const _queryFunc = queryFuncs[queryFunc];
    if (isFunction(_queryFunc)) {
      rows = await _queryFunc(this, queryParams);
    } else {
      throw new Error(`The function "${queryFunc}" is missing.`);
    }
    return rows;
  }

  /**
   * @method connect
   * @returns {Promise}
   */
  connect() {
    const self = this;
    // return Promise
    return new Promise((resolve, reject) => {
      const connection = new Connection(this.config);
      // The attempt to connect and validate has completed.
      connection.on('connect', function (err) {
        // err - If successfully connected, will be falsey. If there was a problem (with either connecting or validation), will be an error object.
        if (err) {
          const errorMessage = err.message? err.message : err;
          logger.error('connection.on("connect") -> Error: %s', errorMessage);
          self.connection = null;
          reject(errorMessage);
        } else {
          // Set current state
          self.connection = connection;
          self.currentState.connError = '';
          self.currentState.isConnected = true;
          self.currentState.isConnCanceled = false;
          self.currentState.isConnReset = false;

          // If no error, then good to go...
          if (isDebug && self.currentState.isConnected) console.log(`Connection to "${self.id}" OK`);
          
          // Subscribe to events
          self.subscribeToConnEvent();

          resolve(self);
        }
      });
      // Internal error occurs
      connection.on('error', function (err) {
        if (err) {
          const errorMessage = err.message? err.message : err;
          logger.error('connection.on("error") -> Error: %s', errorMessage);
          // Set current state
          self.currentState.connError = errorMessage;
          reject(errorMessage);
        }
      });
      connection.connect();
    });
  }

  /**
   * Closes the connection to the database
   * @method disconnect
   *  
   * @returns {Promise}
   */
  disconnect() {
    const self = this;
    return new Promise((resolve, reject) => {
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.on('end', function () {
        self.connection = null;
        if (isDebug && self) console.log(`Disconnect from "${self.id}" OK`);
        // Set current state
        self.currentState.isConnected = false;
        self.currentState.isConnCanceled = false;
        self.currentState.isConnReset = false;
        resolve('Disconnect OK');
      });
      self.connection.close();
    });
  }

  /**
   * Cancel currently executed request
   * @method connCancel
   */
  connCancel() {
    assert(this.connection, 'No connection for MssqlTedious.');
    this.connection.cancel();
    // Set current state
    this.currentState.isConnCanceled = true;
    if (isDebug && this.currentState.isConnCanceled) console.log('Connection cancel OK');
  }

  /**
   * Reset the connection to its initial state. Can be useful for connection pool implementations
   * @method connReset
   * @returns {Promise}
   */
  connReset() {
    const self = this;
    return new Promise((resolve, reject) => {
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.reset(function (err) {
        if (err) {
          logger.error('ConnReset.error: %s', err);
          // Set current state
          self.currentState.connError = err.message;
          reject('ConnReset ERR');
          return;
        }
        // Set current state
        self.currentState.isConnReset = true;
        if (isDebug && self.currentState.isConnReset) console.log('ConnReset OK');
        resolve('ConnReset OK');
      });
    });
  }

  /**
   * @method beginTransaction
   * @description SQL: Begin Transaction
   */
  beginTransaction() {
    const self = this;
    return new Promise((resolve, reject) => {
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.beginTransaction((err) => {
        if (err) {
          // If error in begin transaction, roll back!
          logger.error(`Begin transaction err: ${err}`);
          reject(err);
        } else {
          self.isBeginTransaction = true;
          if (isDebug && self.isBeginTransaction) console.log('BeginTransaction OK');
          resolve('BeginTransaction() done');
        }
      });
    });
  }

  /**
   * @method commitTransaction
   * @description SQL: Commit Transaction (if no errors)
   */
  commitTransaction() {
    const self = this;
    return new Promise((resolve, reject) => {
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.commitTransaction((err) => {
        if (err) {
          logger.error(`Commit transaction err: ${err}`);
          reject(err);
        } else {
          self.isBeginTransaction = false;
          self.isCommitTransaction = true;
          if (isDebug && self.isCommitTransaction) console.log('CommitTransaction OK');
          resolve('CommitTransaction() done!');
        }
      });
    });
  }

  /**
   * @method rollbackTransaction
   * @description SQL: Rolling Back Transaction - due to errors during transaction process.
   * @param {String} errMessage
   * 
   */
  rollbackTransaction(errMessage) {
    const self = this;
    return new Promise((resolve, reject) => {
      logger.error(`Transaction err: "${errMessage}"`);
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.rollbackTransaction((err) => {
        if (err) {
          logger.error(`Transaction rollback error: ${err}`);
          reject(err);
        } else {
          self.isBeginTransaction = false;
          self.isRollbackTransaction = true;
          if (isDebug && self.isRollbackTransaction) console.log('RollbackTransaction OK');
          resolve('RollbackTransaction() done!');
        }
      });
    });
  }

  /**
   * @method insertBulkData
   * @description Executing Bulk Load
   * @param {String} table
   * e.g. table = '[dbo].[test_bulk]' 
   * @param {Array[]} colums 
   * e.g. colums = [
   *  ['c1', TYPES.Int, { nullable: true }], 
   *  ['c2', TYPES.NVarChar, { length: 50, nullable: true }]
   * ] 
   * @param {Object[]} data 
   * e.g  data = [{ c1: 1 }, { c1: 2, c2: 'hello' }];
   * @returns {Number}
   */
  insertBulkData(table, colums, data) {
    const self = this;
    return new Promise((resolve, reject) => {
      const option = { keepNulls: true }; // option to enable null values
      assert(self.connection, 'No connection for MssqlTedious.');
      const bulkLoad = self.connection.newBulkLoad(table, option, (err, rowCount) => {
        if (err) {
          logger.error(`newBulkLoad error: ${err}`);
          reject(err);
        } else {
          if (isDebug && rowCount) console.log(`Rows inserted to table "${table}": ${rowCount}`);
          resolve(rowCount);
        }
      });

      for (let index = 0; index < colums.length; index++) {
        const colum = colums[index];
        bulkLoad.addColumn(...colum);
      }
      // perform bulk insert
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.execBulkLoad(bulkLoad, data);
    });
  }

  /**
   * @method query
   * @param {Object[]} params
   * @param {String} sql
   * @param {Function} callback
   * @returns {Promise}
   */
  query(params, sql, callback) {
    const self = this;
    let _item;
    //-----------------------------
    return new Promise((resolve, reject) => {
      const request = new Request(sql, (err, rowCount) => {
        if (err) {
          logger.error('Query.error: %s', err);
          // Set current state
          self.currentState.requestError = err.message;
          reject(err.message);
          return;
        }
        const _query = sql.trim().split(' ')[0];
        if (isDebug && rowCount) console.log(`RowCount for query "${_query}": ${rowCount}`);
        resolve({ rows: _rows, rowCount });
      });

      // Subscribe to request events
      self.subscribeToRequestEvent(request);

      // Add parameters or add output parameters
      if (params.length > 0) {
        params.forEach(param => {
          if (param.isOutput) {
            request.addOutputParameter(param.name, param.type);
          } else {
            request.addParameter(param.name, param.type, param.value);
          }
        });
      }

      let _rows = [];

      const isOutput = params.find(param => param.isOutput);
      if (isOutput) {
        request.on('returnValue', function (parameterName, value, metadata) {
          _item = {};
          _item[parameterName] = (metadata.type.name === 'Char') ? value.trim() : value;
          _rows.push(_item);
        });
      } else {
        request.on('row', columns => {
          // A row resulting from execution of the SQL statement.
          /**
            columns - An array or object (depends on config.options.useColumnNames), where the columns can be accessed by index/name. Each column has two properties, metadata and value.
              metadata - The same data that is exposed in the columnMetadata event.
              value - The column's value. It will be null for a NULL.
                      If there are multiple columns with the same name, then this will be an array of the values.
           */
          _item = {};
          // Converting the response row to a JSON formatted object: [property]: value
          for (var name in columns) {
            _item[name] = columns[name].value;
          }
          _rows.push(_item);
        });

        // We return the set of rows after the query is complete, instead of returing row by row
        request.on('doneInProc', (rowCount, more, rows) => {
          /**
            Indicates the completion status of a SQL statement within a stored procedure. All rows from a statement in a stored procedure have been provided (through row events).
            This event may also occur when executing multiple calls with the same query using execSql.
            rowCount - The number of result rows. May be undefined if not available.
            more - If there are more result sets to come, then true.
            rows - Rows as a result of executing the SQL. Will only be avaiable if Connection's config.options.rowCollectionOnDone is true.
           */
          if (isDebug) console.log('Request result:', { params, sql, rows: _rows });
          if (callback) callback(_rows);
        });
      }
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.execSql(request);
    });
  }

  /**
   * @method proc
   * @param {Object[]} params
   * @param {String} sql
   * @param {Function} callback
   * @returns {Promise}
   */
  proc(params, sql, callback) {
    const self = this;
    let _item;
    //--------------------------------------
    return new Promise((resolve, reject) => {
      const request = new Request(sql, (err, rowCount) => {
        if (err) {
          logger.error('Request.error: %s', err);
          // Set current state
          self.currentState.requestError = err.message;
          reject(err.message);
          return;
        }
        resolve({ rows: _rows, rowCount });
      });

      // Subscribe to request events
      self.subscribeToRequestEvent(request);

      // Add parameters for request
      if (params.length > 0) {
        params.forEach(param => {
          if (param.isOutput) {
            request.addOutputParameter(param.name, param.type);
          } else {
            request.addParameter(param.name, param.type, param.value);
          }
        });
      }

      let _rows = [];

      const isOutput = params.find(param => param.isOutput);
      if (isOutput) {
        request.on('returnValue', function (parameterName, value, metadata) {
          _item = {};
          _item[parameterName] = (metadata.type.name === 'Char') ? value.trim() : value;
          _rows.push(_item);
        });
      } else {
        request.on('row', columns => {
          // A row resulting from execution of the SQL statement.
          /**
            columns - An array or object (depends on config.options.useColumnNames), where the columns can be accessed by index/name. Each column has two properties, metadata and value.
              metadata - The same data that is exposed in the columnMetadata event.
              value - The column's value. It will be null for a NULL.
                      If there are multiple columns with the same name, then this will be an array of the values.
           */
          _item = {};
          // Converting the response row to a JSON formatted object: [property]: value
          for (var name in columns) {
            _item[name] = columns[name].value;
          }
          _rows.push(_item);
        });

        // We return the set of rows after the procedure is complete, instead of returing row by row
        request.on('doneProc', (rowCount, more, returnStatus, rows) => {
          /**
            Indicates the completion status of a stored procedure. This is also generated for stored procedures executed through SQL statements.
            This event may also occur when executing multiple calls with the same query using execSql.
            rowCount - The number of result rows. May be undefined if not available.
            more - If there are more result sets to come, then true.
            returnStatus - The value returned from a stored procedure.
            rows - Rows as a result of executing the SQL. Will only be avaiable if Connection's config.options.rowCollectionOnDone is true.
           */
          if (isDebug && self.id) console.log('Request result:', { params, sql, rows: _rows });
          if (callback) callback(_rows);
        });
      }
      assert(self.connection, 'No connection for MssqlTedious.');
      self.connection.callProcedure(request);
    });
  }

  /**
   * @method buildParams
   * @param {Object} params 
   * @param {String} paramName 
   * @param {TYPES} paramType 
   * @param {any} paramValue 
   * @param {Boolean} isOutput
   * @returns {Array}
   */
  buildParams(params, paramName, paramType, paramValue = null, isOutput = false) {
    return params.push({
      name: paramName,
      type: paramType,
      value: paramValue,
      isOutput
    });
  }

  /**
   * @method subscribeToConnEvent
   */
  subscribeToConnEvent() {
    const self = this;
    loForEach(self.config.events.connection, (value, key) => {
      assert(self.connection, 'No connection for MssqlTedious.');
      switch (key) {
      case 'debug':
        // A debug message is available. It may be logged or ignored.
        if (value.enable) {
          self.connection.on('debug', function (messageText) {
            // messageText - The debug message.
            value.cb ? value.cb(messageText) : self.onDebugForConn(messageText);
          });
        }
        break;
      case 'infoMessage':
        // The server has issued an information message.
        if (value.enable) self.connection.on('infoMessage', function (info) {
          /**
            info - An object with these properties:
            number - Error number
            state - The error state, used as a modifier to the error number.
            class - The class (severity) of the error. A class of less than 10 indicates an informational message.
            message - The message text.
            procName - The stored procedure name (if a stored procedure generated the message).
            lineNumber - The line number in the SQL batch or stored procedure that caused the error. 
            Line numbers begin at 1; therefore, if the line number is not applicable to the message, the value of LineNumber will be 0. 
            */
          value.cb ? value.cb(info) : self.onInfoMessageForConn(info);
        });
        break;
      case 'errorMessage':
        // The server has issued an error message.
        if (value.enable) self.connection.on('errorMessage', function (err) {
          // err - An object with the same properties as.listed for the infoMessage event.
          value.cb ? value.cb(err) : self.onErrorMessageForConn(err);
        });
        break;
      case 'databaseChange':
        // The server has reported that the active database has changed. This may be as a result of a successful login, or a use statement.
        if (value.enable) self.connection.on('databaseChange', function (databaseName) {
          // databaseName - The name of the new active database
          value.cb ? value.cb(databaseName) : self.onDatabaseChangeForConn(databaseName);
        });
        break;
      case 'languageChange':
        // The server has reported that the language has changed.
        if (value.enable) self.connection.on('languageChange', function (languageName) {
          // languageName - The newly active language.
          value.cb ? value.cb(languageName) : self.onLanguageChangeForConn(languageName);
        });
        break;
      case 'charsetChange':
        // The server has reported that the charset has changed.
        if (value.enable) self.connection.on('charsetChange', function (charset) {
          // charset - The new charset.
          value.cb ? value.cb(charset) : self.onCharsetChangeForConn(charset);
        });
        break;
      case 'secure':
        // A secure connection has been established.
        if (value.enable) self.connection.on('secure', function (cleartext) {
          // cleartext - The cleartext stream of a tls SecurePair. The cipher and peer certificate (server certificate) may be inspected if desired.
          value.cb ? value.cb(cleartext) : self.onSecureForConn(cleartext);
        });
        break;
      default:
        break;
      }
    });
  }

  /**
   * @method subscribeToRequestEvent
   * @param {Object} request
   */
  subscribeToRequestEvent(request) {
    const self = this;
    loForEach(this.config.events.request, (value, key) => {
      switch (key) {
      case 'columnMetadata':
        //This event, describing result set columns, will be emitted before row events are emitted. 
        // This event may be emited multiple times when more than one recordset is produced by the statement.
        if (value.enable) request.on('columnMetadata', function (columns) {
          /**
            An array like object, where the columns can be accessed either by index or name. 
            Columns with a name that is an integer are not accessible by name, as it would be interpreted as an array index.
            Each column has these properties.
            colName - The column's name.
            type.name - The column's type, such as VarChar, Int or Binary.
            precision - The precision. Only applicable to numeric and decimal.
            scale - The scale. Only applicable to numeric, decimal, time, datetime2 and datetimeoffset.
            dataLength - The length, for char, varchar, nvarchar and varbinary. 
            */
          value.cb ? value.cb(columns) : self.onColumnMetadataForRequest(columns);
        });
        break;
      case 'prepared':
        // The request has been prepared and can be used in subsequent calls to execute and unprepare
        if (value.enable) request.on('prepared', function () {
          value.cb ? value.cb() : self.onPreparedForRequest();
        });
        break;
      case 'error':
        if (value.enable) request.on('error', function (err) {
          // The request encountered an error and has not been prepared
          value.cb ? value.cb(err) : self.onErrorForRequest(err);
        });
        break;
      case 'requestCompleted':
        // This is the final event emitted by a request. This is emitted after the callback passed in a request is called
        if (value.enable) request.on('requestCompleted', function () {
          value.cb ? value.cb() : self.onRequestCompletedForRequest();
        });
        break;
      case 'done':
        /**
          All rows from a result set have been provided (through row events). 
          This token is used to indicate the completion of a SQL statement. 
          As multiple SQL statements can be sent to the server in a single SQL batch, multiple done events can be generated. 
          An done event is emited for each SQL statement in the SQL batch except variable declarations. 
          For execution of SQL statements within stored procedures, doneProc and doneInProc events are used in place of done events.
                      
          If you are using execSql then SQL server may treat the multiple calls with the same query as a stored procedure. 
          When this occurs, the doneProc or doneInProc events may be emitted instead. 
          You must handle both events to ensure complete coverage. 
          */
        if (value.enable) request.on('done', function (rowCount, more, rows) {
          /**
            rowCount - The number of result rows. May be undefined if not available.
            more - If there are more results to come (probably because multiple statements are being executed), then true.
            rows - Rows as a result of executing the SQL statement. Will only be avaiable if Connection's config.options.rowCollectionOnDone is true. 
            */
          value.cb ? value.cb(rowCount, more, rows) : self.onDoneForRequest(rowCount, more, rows);
        });
        break;
      case 'returnValue':
        // A value for an output parameter (that was added to the request with addOutputParameter(...)).
        if (value.enable) request.on('returnValue', function (parameterName, value, metadata) {
          /**
            parameterName - The parameter name. (Does not start with '@'.)
            value - The parameter's output value.
            metadata - The same data that is exposed in the columnMetadata event. 
            */
          value.cb ? value.cb(parameterName, value, metadata) : self.onReturnValueForRequest(parameterName, value, metadata);
        });
        break;
      case 'order':
        // This event gives the columns by which data is ordered, if ORDER BY clause is executed in SQL Server.
        if (value.enable) request.on('order', function (orderColumns) {
          /**
            orderColumns - An array of column numbers in the result set by which data is ordered. 
            */
          value.cb ? value.cb(orderColumns) : self.onOrderForRequest(orderColumns);
        });
        break;
      default:
        break;
      }
    });
  }

  /**
   * @method onDebugForConn
   * @param {String} messageText 
   */
  onDebugForConn(messageText) {
    console.log('connection.on(debug) messageText: ', messageText);
  }

  /**
   * @method onInfoMessageForConn
   * @param {Object} info 
   */
  onInfoMessageForConn(info) {
    console.log('connection.on(infoMessage) info: ', info);
  }

  /**
   * @method onErrorMessageForConn
   * @param {Object} err 
   */
  onErrorMessageForConn(err) {
    console.log('connection.on(errorMessage) error: ', err.message);
  }

  /**
   * @method onDatabaseChangeForConn
   * @param {String} databaseName 
   */
  onDatabaseChangeForConn(databaseName) {
    console.log('connection.on(databaseChange) databaseName: ', databaseName);
  }

  /**
   * @method onLanguageChangeForConn
   * @param {String} languageName 
   */
  onLanguageChangeForConn(languageName) {
    console.log('connection.on(languageChange) languageName: ', languageName);
  }

  /**
   * @method onCharsetChangeForConn
   * @param {String} charset 
   */
  onCharsetChangeForConn(charset) {
    console.log('connection.on(charsetChange) charset: ', charset);
  }

  /**
   * @method onSecureForConn
   * @param {String} charset 
   */
  onSecureForConn(cleartext) {
    console.log('connection.on(secure) cleartext: ', cleartext);
  }

  /**
   * @method onColumnMetadataForRequest
   * @param {Object} charset 
   */
  onColumnMetadataForRequest(columns) {
    console.log('request.on(columnMetadata) columns: ', columns);
  }

  /**
   * @method onPreparedForRequest
   */
  onPreparedForRequest() {
    console.log('request.on(prepared): OK');
  }

  /**
   * @method onErrorForRequest
   * @param {Object} err 
   */
  onErrorForRequest(err) {
    console.log('request.on(error) message:', err.message);
  }

  /**
   * @method onRequestCompletedForRequest
   */
  onRequestCompletedForRequest() {
    console.log('request.on(requestCompleted) OK');
  }

  /**
   * @method onDoneForRequest
   * @param {Number} rowCount 
   * @param {Boolean} more 
   * @param {Object[]} rows 
   */
  onDoneForRequest(rowCount, more, rows) {
    console.log('request.on(done) rowCount, more, rows:', rowCount, more, rows);
  }

  /**
   * @method onReturnValueForRequest
   * @param {String} parameterName 
   * @param {any} value 
   * @param {Object} metadata 
   */
  onReturnValueForRequest(parameterName, value, metadata) {
    console.log('request.on(returnValue) parameterName, value, metadata:', parameterName, value, metadata);
  }

  /**
   * @method onOrderForRequest
   * @param {Number[]} orderColumns
   */
  onOrderForRequest(orderColumns) {
    console.log('request.on(order) orderColumns: ', orderColumns);
  }
}

module.exports = MssqlTedious;
