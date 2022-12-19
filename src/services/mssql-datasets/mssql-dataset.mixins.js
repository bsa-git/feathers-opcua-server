/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');
const { inspector } = require('../../plugins/lib');

const {
  MssqlTedious,
} = require('../../plugins/db-helpers');

const debug = require('debug')('app:mssql-datasets.mixins');
const isDebug = true;

let result;



module.exports = function mssqlDatasetsMixins(service, path) {

  /**
   * @method getPathForMixins
   * @param {String} action 
   * @returns {Array}
   * e.g. return -> ['id', 'params', 'getters', 'methods']
   */
  service.getPathForMixins = function (action) {
    switch (action) {
    case 'createMssqlDataset':
      result = ['config'];
      break;
    case 'beginTransaction':
    case 'commitTransaction':
    case 'connect':
    case 'disconnect':
    case 'connCancel':
    case 'connReset':
      result = ['id'];
      break;
    case 'rollbackTransaction':
      result = ['id', 'errMessage'];
      break;
    case 'executeQuery':
      result = ['id', 'queryFunc', 'queryParams'];
      break;
    case 'buildParams':
      result = ['id', 'params', 'paramName', 'paramType', 'paramValue'];
      break;
    case 'query':
    case 'proc':
      result = ['id', 'params', 'sql', 'callback'];
      break;
    case 'insertBulkData':
      result = ['id', 'table', 'colums', 'data'];
      break;
    default:
      break;
    }
    return result;
  };

  /**
   * @method create
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.createMssqlDataset = async function (config) {
    // Create DB
    const db = new MssqlTedious(config);
    if (db.isDatasetInList(service)) {
      throw new errors.BadRequest(`The mssql dataset already exists for this id = '${db.id}' in the service list`);
    }
    // DB connect
    await db.connect();
    // Get createdAt
    const dt = moment().utc().valueOf();
    // Add mssqlDataset to service list
    const mssqlDataset = {
      id: db.id,
      db,
      createdAt: dt,
      updatedAt: dt
    };
    service.mssqlDatasets.push(mssqlDataset);
    // Get result
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method beginTransaction
   * @description SQL: Begin Transaction
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.beginTransaction = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.beginTransaction();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method commitTransaction
   * @description SQL: Commit Transaction (if no errors)
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.commitTransaction = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.commitTransaction();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method rollbackTransaction
   * @description SQL: Rolling Back Transaction - due to errors during transaction process.
   * @async
   * 
   * @param {String} id 
   * @param {String} errMessage
   * @returns {Object}
   */
  service.rollbackTransaction = async function (id, errMessage) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.commitTransaction(errMessage);
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method connect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.connect = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.connect();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method connDisconnect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.disconnect = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.disconnect();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method connCancel
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.connCancel = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.connCancel();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method connReset
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.connReset = async function (id) {
    const mssqlDataset = await service.get(id);
    await mssqlDataset.db.connReset();
    result = Object.assign({}, mssqlDataset, mssqlDataset.db.getDatasetForProvider());
    return result;
  };

  /**
   * @method insertBulkData
   * @description Executing Bulk insert
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
  service.insertBulkData = async function (id, table, colums, data) {
    const mssqlDataset = await service.get(id);
    result = mssqlDataset.db.insertBulkData(table, colums, data);
    return result;
  };

  /**
   * @method query
   * @async
   * 
   * @param {String} id
   * @param {Object} params  
   * @param {String} sql
   * @param {Function} callback 
   * @returns {Object|Object[]}
   */
  service.query = async function (id, params, sql, callback) {
    const mssqlDataset = await service.get(id);
    result = mssqlDataset.db.query(params, sql, callback);
    return result;
  };

  /**
   * @method proc
   * @async
   * 
   * @param {String} id
   * @param {Object} params  
   * @param {String} sql
   * @param {Function} callback 
   * @returns {Object|Object[]}
   */
  service.proc = async function (id, params, sql, callback) {
    const mssqlDataset = await service.get(id);
    result = mssqlDataset.db.proc(params, sql, callback);
    return result;
  };

  /**
   * @method buildParams
   * @async
   * 
   * @param {String} id
   * @param {Object} params  
   * @param {String} paramName
   * @param {any} paramType
   * @param {any} paramValue 
   * @returns {Object[]}
   */
  service.buildParams = async function (id, params, paramName, paramType, paramValue) {
    const mssqlDataset = await service.get(id);
    result = mssqlDataset.db.buildParams(params, paramName, paramType, paramValue);
    return result;
  };

  /**
   * @method executeQuery
   * @async
   * 
   * @param {String} id
   * @param {String} queryFunc
   * e.g. queryFunc = 'getTagInfoFromChAsoduDB' 
   * @param {Object} queryParams 
   * e.g. queryParams = { "scanerName": "opcUA(A5)", "tagGroup": "XozUchet" } 
   * @returns {Object}
   */
  service.executeQuery = async function (id, queryFunc, queryParams) {
    const mssqlDataset = await service.get(id);
    result = await mssqlDataset.db.executeQuery(queryFunc, queryParams);
    return result;
  };

};
