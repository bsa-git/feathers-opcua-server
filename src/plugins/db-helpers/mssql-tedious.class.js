/* eslint-disable no-unused-vars */
const loMerge = require('lodash/merge');
const loForEach = require('lodash/forEach');
const { Connection, Request, TYPES } = require('tedious');

const debug = require('debug')('app:mssql-tedious.class');

const isDebug = false;

const connectionConfig = {
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
    debug: false,
    infoMessage: false,
    errorMessage: false,
    databaseChange: false,
    languageChange: false,
    charsetChange: false,
    secure: false,
  }
};

let _rows = [];

class MssqlTedious {
  /**
   * Constructor
   * @param {Object} config
   */
  constructor(config) {
    this.connectionConfig = loMerge({}, connectionConfig, config.connection);
    this.connection = null;
  }

  /**
   * @method connect
   * @returns {Promise}
   */
  connect() {
    const self = this;
    // return Promise
    return new Promise((resolve, reject) => {
      const connection = new Connection(this.connectionConfig);

      connection.on('connect', function (err) {
        if (err) {
          console.log('connection.on("connect") -> Error: ', err);
          reject('Connection ERR');
        } else {
          // If no error, then good to go...
          console.log('Connection OK');
          self.connection = connection;//Object.assign({}, connection);
          // console.log('Connection:', connection);
          // Subscribe to event
          self.subscribeToConnEvent();
          resolve('Connection OK');
        }
      });

      connection.on('error', function (err) {
        if (err) {
          console.log('Error: ', err);
          reject('Connection ERR');
        }
      });
      connection.connect();
    });
  }

  /**
   * Cancel currently executed request
   * @method connCancel
   */
  connCancel() {
    this.connection.cancel();
    console.log('RequestCancel OK');
  }

  /**
   * Closes the connection to the database
   * @method connDisconnect 
   * @returns {Promise}
   */
  connDisconnect() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connection.close();
      self.connection.on('end', function () {
        self.connection = null;
        console.log('ConnectionDisconnect OK');
        resolve('ConnectionDisconnect OK');
      });

    });
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
          console.log('ConnectionReset.error: ', err);
          reject('ConnectionReset ERR');
          return;
        }
        console.log('ConnectionReset OK');
        resolve('ConnectionReset OK');
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
          reject('Request ERR');
          return;
        }
        resolve('Request OK');
      });

      if (params.length > 0) {
        params.forEach(param => {
          request.addParameter(param.name, param.type, param.value);
        });
      }

      _rows = [];

      request.on('row', columns => {
        let _item = {};
        // Converting the response row to a JSON formatted object: [property]: value
        for (var name in columns) {
          _item[name] = columns[name].value;
        }
        _rows.push(_item);
      });

      // We return the set of rows after the query is complete, instead of returing row by row
      request.on('doneInProc', (rowCount, more, rows) => {
        if (isDebug) console.log('Request result:', { params, sql, rows: _rows });
        callback(_rows);
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
          reject('Request ERR');
          return;
        }
        resolve('Request OK');
      });

      if (params.length > 0) {
        params.forEach(param => {
          request.addParameter(param.name, param.type, param.value);
        });
      }

      _rows = [];

      request.on('row', columns => {
        let _item = {};
        // Converting the response row to a JSON formatted object: [property]: value
        for (var name in columns) {
          _item[name] = columns[name].value;
        }
        _rows.push(_item);
      });

      // We return the set of rows after the procedure is complete, instead of returing row by row
      request.on('doneProc', (rowCount, more, rows) => {
        if (isDebug) console.log('Request result:', { params, sql, rows: _rows });
        callback(_rows);
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
    loForEach(this.connectionConfig.events, (value, key) => {
      switch (key) {
      case 'debug':
        if (value) this.connection.on('debug', function (messageText) {
          console.log('MessageText: ', messageText);
        });
        break;
      case 'infoMessage':
        if (value) this.connection.on('infoMessage', function (info) {
          console.log('Info: ', info);
        });
        break;
      case 'errorMessage':
        if (value) this.connection.on('errorMessage', function (err) {
          console.log('Error: ', err);
        });
        break;
      case 'databaseChange':
        if (value) this.connection.on('databaseChange', function (databaseName) {
          console.log('DatabaseName: ', databaseName);
        });
        break;
      case 'languageChange':
        if (value) this.connection.on('languageChange', function (languageName) {
          console.log('LanguageName: ', languageName);
        });
        break;
      case 'charsetChange':
        if (value) this.connection.on('charsetChange', function (charset) {
          console.log('Charset: ', charset);
        });
        break;
      case 'secure':
        if (value) this.connection.on('secure', function (cleartext) {
          console.log('Cleartext: ', cleartext);
        });
        break;
      default:
        break;
      }
    });
  }
}

module.exports = MssqlTedious;
