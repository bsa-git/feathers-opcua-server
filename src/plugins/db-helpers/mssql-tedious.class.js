/* eslint-disable no-unused-vars */
const loMerge = require('lodash/merge');
const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');
const { Connection, Request, TYPES } = require('tedious');
const { getIdFromMssqlConfig } = require('./db-helper');

const debug = require('debug')('app:mssql-tedious.class');

const isDebug = false;

const defaultConnConfig = {
  server: 'server',
  options: {
    instanceName: 'instanceName',
    encrypt: false,
    database: 'database',
    connectTimeout: 3000,
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
        enable: true
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
   * @param {Object} config
   */
  constructor(config) {
    this.config = Object.assign({}, config);
    this.id = getIdFromMssqlConfig(this.config);
    this.connection = null;
    this.currentState = {
      id: this.id,
      connectionConfig: this.getConnConfigForCurrentState(),
      connError: '',
      requestError: '',
      isConnected: false,
      isConnCanceled: false,
      isConnReset: false
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
   * @method connect
   * @returns {Promise}
   */
  connect() {
    const self = this;
    // return Promise
    return new Promise((resolve, reject) => {
      const connection = new Connection(this.config);
      self.connection = connection;
      // Subscribe to events
      self.subscribeToConnEvent();
      // The attempt to connect and validate has completed.
      connection.on('connect', function (err) {
        // err - If successfully connected, will be falsey. If there was a problem (with either connecting or validation), will be an error object.
        if (err) {
          console.log('connection.on("connect") -> Error: ', err.message);
          self.connection = null;
          reject(err.message);
        } else {
          // If no error, then good to go...
          console.log('Connection OK');
          // self.connection = connection;
          // Subscribe to events
          // self.subscribeToConnEvent();
          // Set current state
          self.currentState.connError = '';
          self.currentState.isConnected = true;
          self.currentState.isConnCanceled = false;
          self.currentState.isConnReset = false;
          resolve('Connection OK');
        }
      });
      // Internal error occurs
      connection.on('error', function (err) {
        if (err) {
          console.log('Error: ', err);
          // Set current state
          self.currentState.connError = err.message;
          reject(err.message);
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
      self.connection.close();
      self.connection.on('end', function () {
        self.connection = null;
        console.log('Disconnect OK');
        // Set current state
        self.currentState.isConnected = false;
        self.currentState.isConnCanceled = false;
        self.currentState.isConnReset = false;
        resolve('Disconnect OK');
      });

    });
  }

  /**
   * Cancel currently executed request
   * @method connCancel
   */
  connCancel() {
    this.connection.cancel();
    console.log('RequestCancel OK');
    // Set current state
    this.currentState.isConnCanceled = true;
  }

  /**
   * Reset the connection to its initial state. Can be useful for connection pool implementations
   * @method connReset
   * @returns {Promise}
   */
  connReset() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connection.reset(function (err) {
        if (err) {
          console.log('ConnReset.error: ', err);
          // Set current state
          self.currentState.connError = err.message;
          reject('ConnReset ERR');
          return;
        }
        console.log('ConnReset OK');
        // Set current state
        self.currentState.isConnReset = true;
        resolve('ConnReset OK');
      });
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
    return new Promise((resolve, reject) => {
      const request = new Request(sql, (err, rowCount) => {
        if (err) {
          console.log('Request.error: ', err);
          // Set current state
          self.currentState.requestError = err.message;
          reject(err.message);
          return;
        }
        resolve(_rows);
      });

      // Subscribe to request events
      self.subscribeToRequestEvent(request);

      if (params.length > 0) {
        params.forEach(param => {
          request.addParameter(param.name, param.type, param.value);
        });
      }

      let _rows = [];

      request.on('row', columns => {
        // A row resulting from execution of the SQL statement.
        /**
          columns - An array or object (depends on config.options.useColumnNames), where the columns can be accessed by index/name. Each column has two properties, metadata and value.
            metadata - The same data that is exposed in the columnMetadata event.
            value - The column's value. It will be null for a NULL.
                    If there are multiple columns with the same name, then this will be an array of the values.
         */
        let _item = {};
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
    return new Promise((resolve, reject) => {
      const request = new Request(sql, (err, rowCount) => {
        if (err) {
          console.log('Request.error: ', err);
          // Set current state
          self.currentState.requestError = err.message;
          reject(err.message);
          return;
        }
        resolve(_rows);
      });

      // Subscribe to request events
      self.subscribeToRequestEvent(request);

      if (params.length > 0) {
        params.forEach(param => {
          request.addParameter(param.name, param.type, param.value);
        });
      }

      let _rows = [];

      request.on('row', columns => {
        // A row resulting from execution of the SQL statement.
        /**
          columns - An array or object (depends on config.options.useColumnNames), where the columns can be accessed by index/name. Each column has two properties, metadata and value.
            metadata - The same data that is exposed in the columnMetadata event.
            value - The column's value. It will be null for a NULL.
                    If there are multiple columns with the same name, then this will be an array of the values.
         */
        let _item = {};
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
        if (isDebug) console.log('Request result:', { params, sql, rows: _rows });
        if (callback) callback(_rows);
      });
      self.connection.callProcedure(request);
    });
  }

  /**
   * @method buildParams
   * @param {Object} params 
   * @param {String} paramName 
   * @param {TYPES} paramType 
   * @param {any} paramValue 
   * @returns {Array}
   */
  buildParams(params, paramName, paramType, paramValue) {
    return params.push({
      name: paramName,
      type: paramType,
      value: paramValue
    });
  }

  /**
   * @method subscribeToConnEvent
   */
  subscribeToConnEvent() {
    const self = this;
    loForEach(self.config.events.connection, (value, key) => {
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
