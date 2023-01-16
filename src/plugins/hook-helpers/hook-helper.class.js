/* eslint-disable no-unused-vars */
const loMerge = require('lodash/merge');
const loIsBuffer = require('lodash/isBuffer');
const loIsPlainObject = require('lodash/isPlainObject');

const {
  isProvider,
  checkContext,
  getItems,
  replaceItems
} = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { inspector, appRoot, isObject, isTrue, readJsonFileSync } = require('../lib');
const {
  getCountItems,
  getItem,
  findItems,
  findAllItems,
  handleFoundItems,
  removeItem,
  removeItems,
  patchItem,
  patchItems,
  createItem,
  createItems
} = require('../db-helpers');
const chalk = require('chalk');

// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};

const debug = require('debug')('app:plugin.hook-helper.class');
const isDebug = false;

class HookHelper {
  /**
   * Constructor
   * @param context
   */
  constructor(context) {
    // Throw if the hook is being called from an unexpected location.
    checkContext(context, null, ['find', 'get', 'create', 'update', 'patch', 'remove']);
    // Get context
    this.context = Object.assign({}, context);
    // context.app is a read only property that contains the Feathers application object.
    // This can be used to retrieve other services (via context.app.service('name')) or configuration values
    this.app = this.context.app;
    // context.service is a read only property and contains the service this hook currently runs on
    this.contextService = this.context.service ? this.context.service : null;
    // context.id is a writeable property and the id for a get, remove, update and patch service method call
    this.contextId = this.context.id;
    // context.path is a read only property and contains the service name (or path) without leading or trailing slashes
    this.contextPath = this.context.path;
    // context.method is a read only property with the name of the service method (one of find, get, create, update, patch, remove)
    this.contextMethod = this.context.method;
    // context.type is a read only property with the hook type (one of before, after or error)
    this.contextType = this.context.type;
    // context.params is a writeable property that contains the service method parameters
    this.contextParams = this.context.params ? this.context.params : null;
    // Get the authenticated user.
    this.contextUser = (this.contextParams && this.contextParams.user) ? this.contextParams.user : null;
    // Get context.params.authenticated
    this.contextAuthenticated = this.contextParams && this.contextParams.authenticated ? this.contextParams.authenticated : null;
    // Get contextParams.payload
    this.contextPayload = this.contextParams && this.contextParams.payload ? this.contextParams.payload : null;
    // Get the record(s) from context.data (before), context.result.data or context.result (after).
    // getItems always returns an array to simplify your processing.
    this.contextRecords = getItems(this.context);
    // context.data is a writeable property containing the data of a create, update and patch service method call
    this.contextData = this.context.data ? this.context.data : null;
    // context.result is a writeable property containing the result of the successful service method call.
    // It is only available in after hooks.
    this.contextResult = this.context.result ? this.context.result : null;
    // Get contextResult.accessToken
    this.contextAccessToken = this.contextResult && this.contextResult.accessToken ? this.contextResult.accessToken : '';
    // context.dispatch is a writeable, optional property and contains a "safe" version of the data that should be sent to any client.
    // If context.dispatch has not been set context.result will be sent to the client instead
    this.contextDispatch = this.context.dispatch ? this.context.dispatch : null;
    // context.statusCode is a writeable, optional property that allows to override the standard HTTP status code that should be returned.
    this.contextStatusCode = this.context.statusCode;
    // context.error is a writeable property with the error object that was thrown in a failed method call. It is only available in error hooks.
    // Note: context.error will only be available if context.type is error.
    this.contextError = this.context.error ? this.context.error : null;
    // Get provider
    this.contextProvider = this.contextParams && this.contextParams.provider ? this.contextParams.provider : '';
  }


  /**
   * Is mask
   * @param mask // 'authentication.create.after'
   */
  isMask(mask = '') {
    const maskItems = mask.split('.');
    return (maskItems[0] === this.contextPath) && (maskItems[1] === this.contextMethod) && (maskItems[2] === this.contextType);
  }

  /**
   * Show debug info
   * @param {String} mask // 'authentication.create.after'
   * @param {Boolean} show
   * @param {Boolean} isConn
   */
  showDebugInfo(mask = '', show = true, isConn = false) {
    if (this.contextError) return;
    if (mask) {
      const maskItems = mask.split('.');
      if (maskItems.length === 1) {// {'authentication'|'*'}
        if (show && (maskItems[0] === this.contextPath || maskItems[0] === '*')) {
          inspector(`showDebugInfo::${mask}:`, HookHelper.getHookContext(this.context, isConn));
        }
      }
      if (maskItems.length === 2) {// {'authentication.create'|'*.create'|'authentication.*'}
        if (show && (maskItems[0] === this.contextPath || maskItems[0] === '*') && (maskItems[1] === this.contextMethod || maskItems[1] === '*')) {
          inspector(`showDebugInfo::${mask}:`, HookHelper.getHookContext(this.context, isConn));
        }
      }
      if (maskItems.length === 3) {// {'authentication.create.after'|'*.create.after'|'authentication.*.after'}
        if (show && (maskItems[0] === this.contextPath || maskItems[0] === '*') && (maskItems[1] === this.contextMethod || maskItems[1] === '*') && (maskItems[2] === this.contextType)) {
          inspector(`showDebugInfo::${mask}:`, HookHelper.getHookContext(this.context, isConn));
        }
      }
    } else {
      if (show) {
        inspector('showDebugInfo:', HookHelper.getHookContext(this.context, isConn));
      }
    }
  }

  /**
   * Show debug records
   * @param {String} mask // 'authentication.create.after'
   * @param {Boolean} show
   */
  showDebugRecords(mask = '', show = true) {
    if (this.contextError) return;
    if (mask) {
      const maskItems = mask.split('.');
      if (show && (maskItems[0] === this.contextPath) && (maskItems[1] === this.contextMethod) && (maskItems[2] === this.contextType)) {
        inspector(`showDebugRecords::${mask}:`, this.contextRecords);
      }
    } else {
      if (show) inspector('showDebugRecords:', this.contextRecords);
    }

  }

  /**
   * Show debug error
   */
  showDebugError() {
    if (this.contextError) {
      const _contextError = this.getDebugError();
      console.error(chalk.red(`ErrorMessage: ${this.contextError.message}`), _contextError);
    }
  }

  /**
   * Get debug error
   */
  getDebugError() {
    let result = null;
    if (this.contextError) {
      const _contextError = Object.assign({}, this.contextError);
      _contextError.service = _contextError.hook ? `${_contextError.hook.path}.${_contextError.hook.method}.${_contextError.hook.type}` : 'error';
      if (_contextError.app) delete _contextError.app;
      if (_contextError.hook) delete _contextError.hook;
      if (_contextError.message) delete _contextError.message;
      if (_contextError.className) delete _contextError.className;
      if (_contextError.data && !Object.keys(_contextError.data).length) delete _contextError.data;
      if (_contextError.errors && !Object.keys(_contextError.errors).length) delete _contextError.errors;
      result = _contextError;
    }
    return result;
  }

  /**
   * Get id field
   * @param {Array|Object} items
   * @return {String}
   */
  static getIdField(items) {
    let idField = '';
    if (Array.isArray(items) && items.length) {
      idField = 'id' in items[0] ? 'id' : '_id';
    }
    if (isObject(items) && Object.keys(items).length) {
      idField = 'id' in items ? 'id' : '_id';
    }
    return idField ? idField : new errors.GeneralError('Items argument is not an array or object');
  }

  /**
   * Determine if environment allows test
   * @return {Boolean}
   */
  static isTest() {
    return feathersSpecs.app.envTestModeName === process.env.NODE_ENV;
  }

  /**
   * Is env react client
   * @returns {Boolean}
   */
  static isEnvReactClient() {
    return isTrue(process.env.IS_REACT_CLIENT);
  }

  /**
   * Is populate items
   * @param {Object} context
   * @returns {Boolean} 
   */
  static isPopulateItems(context) {
    if (HookHelper.isTest()) return false;
    const isEnvReactClient = isTrue(process.env.IS_REACT_CLIENT);
    if (isDebug) debug('isPopulateItems.isProvider(\'external\'):', isProvider('external')(context));
    if (isDebug) debug('isPopulateItems.isProvider(\'rest\'):', isProvider('rest')(context));
    const result = isProvider('server')(context) || isProvider('rest')(context) || !isEnvReactClient;
    if (isDebug) debug('isPopulateItems.result:', result);
    return result;
  }

  /**
   * Get context id
   * @returns {String}
   */
  getContextId() {

    if(loIsBuffer(this.contextId)){
      return this.contextId.toString();
    }

    if (loIsPlainObject(this.contextId)) {
      const idField = HookHelper.getIdField(this.contextId);
      return this.contextId[idField];
    } 
    
    return this.contextId;

  }

  /**
   * Get hook context
   * @param {Object} context 
   * @param {Boolean} isConn 
   * @returns {Object}
   */
  static getHookContext(context, isConn = false) {
    let target = {};
    let { path, method, type, params, id, data, result, statusCode } = Object.assign({}, context);
    // let {} = params;

    if (path) target.path = path;
    if (method) target.method = method;
    if (type) target.type = type;
    if (params) {
      target.params = {};

      let { user, authenticated, authentication, provider, query, connection, headers , rules, ability } = params;

      if (user) {
        target.params.user = user;
      }

      if (authenticated) {
        target.params.authenticated = authenticated;
      }

      if (authentication) {
        target.params.authentication = authentication;
      }

      if (provider) {
        target.params.provider = provider;
      }

      // if(ability){
      //   target.params.ability = ability;
      // }

      // if(rules){
      //   target.params.rules = rules;
      // }

      if (query && Object.keys(query).length > 0) {
        target.params.query = query;
      }

      if (isConn && connection && Object.keys(connection).length > 0) {
        target.params.connection = connection;
      }

      if(isConn && headers && Object.keys(headers).length > 0) {
        target.params.headers = headers;
      }
    }
    if (id) target.id = id;
    if (data && type === 'before') target.data = data;
    if (result) target.result = result;
    if (statusCode) target.statusCode = statusCode;
    return Object.assign({}, target);
  }


  /**
   * Merge items
   * @param records {Array || Object}
   * @param source {Object}
   * @return {Array|Object}
   */
  static mergeItems(records, source = {}) {
    let _records;
    if (Array.isArray(records)) {
      _records = records.map(record => loMerge({}, record, source));
    } else {
      _records = loMerge({}, records, source);
    }
    return _records;
  }

  /**
   * Merge records
   * @param {Object} source
   */
  mergeRecords(source = {}) {
    if (Array.isArray(this.contextRecords)) {
      this.contextRecords.forEach(record => loMerge(record, source));
    } else {
      loMerge(this.contextRecords, source);
    }
  }

  /**
   * Get pick records
   * @param {Function} fn
   * @return {Object|Object[]}
   */
  getPickRecords(fn) {
    let _records;
    if (Array.isArray(this.contextRecords)) {
      _records = this.contextRecords.map(record => fn(record));
    } else {
      _records = fn(this.contextRecords);
    }
    return _records;
  }

  /**
   * For each records
   * @param {Function} fn 
   * @return {Promise}
   */
  async forEachRecords(fn) {
    // const _fn = fn.bind(this);
    const _recordHandle = async record => await fn(record);
    if (Array.isArray(this.contextRecords)) {
      for (let i = 0; i < this.contextRecords.length; i++) {
        const record = this.contextRecords[i];
        await _recordHandle(record);
      }
    } else {
      await fn(this.contextRecords);
    }
  }

  /**
   * Replace records for context
   * @param {Object} context
   * @return {HookHelper|Object}
   */
  replaceRecordsForContext(context = null) {
    // Place the modified records back in the context.
    if (context) {
      replaceItems(context, this.contextRecords);
      return context;
    } else {
      replaceItems(this.context, this.contextRecords);
      return this;
    }
  }

  /**
   * Relationship check
   * @async
   * 
   * @param {String} path
   * @param {String} id
   * @return {void|Error}
   */
  async validateRelationship(path = '', id = null) {
    const result = await this.getItem(path, id.toString());
    if (isDebug) inspector(`validateRelationship(path='${path}', id='${id}').result:`, result);
    if (!result) {
      throw new errors.BadRequest(`There is no entry in the service('${path}') for id: '${id}'`);
    }
  }

  /**
   * Restrict service max rows
   * @async
   * 
   * @param {String} servicePath
   * @param {Number} maxRows
   * @param {Object} query
   * @return {Object[]}
   */
  async restrictMaxRows(servicePath = '', maxRows = -1, query = {}) {
    let findResults = await this.getCountItems(servicePath, query);
    if (isDebug) debug(`restrictMaxRows: (${findResults}) records have been find from the "${servicePath}" service`);
    if (findResults > maxRows) {
      if (!this.contextRecords) throw new errors.BadRequest('Value of "restrictMaxRows:contextRecords" must not be empty.');
      const idField = HookHelper.getIdField(this.contextRecords);
      const newQuery = loMerge({}, query, {
        $skip: maxRows,
        $sort: { createdAt: -1 },
        $select: [idField]
      });
      findResults = await this.findAllItems(servicePath, newQuery);
      findResults = findResults.map(item => item[idField]);
      if (isDebug) debug('restrictMaxRows.findResults.length:', findResults.length);
      let removeResults = await this.removeItems(servicePath, { [idField]: { $in: findResults } });
      if (isDebug) debug('restrictMaxRows.removeResults.length:', removeResults.length);
      return removeResults;
    }
  }

  /**
   * Uniqueness check
   * @async
   * 
   * @param {Object} query
   * @return {void|Error}
   */
  async validateUnique(servicePath = '', query = {}) {
    let results = await this.getCountItems(servicePath, query);
    if (isDebug && servicePath) debug(`validateUnique(servicePath='${servicePath}', query=${JSON.stringify(query)}).results:`, results);
    if (results) {
      throw new errors.BadRequest('Values must be unique');
    }
  }

  //===================================================================================================

  /**
   * Get count items
   * @async
   * 
   * @param {String} path
   * @param {Object} query
   * @return {Number}
   */
  async getCountItems(path = '', query = {}) {
    return await getCountItems(this.app, path, query);
  }

  /**
   * Get item
   * @async
   * 
   * @param {String} path
   * @param {String} id
   * @param {Object} query
   * e.g query -> { $select: ['userName', 'userType'] }
   * @return {Object}
   */
  async getItem(path = '', id = null, query = {}) {
    return await getItem(this.app, path, id, query);
  }

  /**
   * Find items
   * @async
   * 
   * @param {String} path
   * @param {Object} query
   * @return {Object[]}
   */
  async findItems(path = '', query = {}) {
    return await findItems(this.app, path, query);
  }

  /**
   * Find all items
   * @async
   * 
   * @param {String} path
   * @param {Object} query
   * @return {Object[]}
   */
  async findAllItems(path = '', query = {}) {
    return await findAllItems(this.app, path, query);
  }

  /**
 * Process found items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @param {Function} cb
 * @return {Object[]}
 */
  async handleFoundItems(path = '', query = {}, cb = null) {
    return await handleFoundItems(this.app, path = '', query = {}, cb = null);
  }

  /**
   * Remove item
   * @async
   * 
   * @param {String} path
   * @param {String} id
   * @param {Object} query
   * e.g query -> { $select: ['userName', 'userType'] }
   * @return {Object}
   */
  async removeItem(path = '', id = null, query = {}) {
    return await removeItem(this.app, path, id, query);
  }

  /**
   * Remove items
   * @async
   * 
   * @param {String} path
   * @param {Object} query
   * @return {Object[]}
   */
  async removeItems(path = '', query = {}) {
    return await removeItems(this.app, path, query);
  }


  /**
   * Patch item
   * @async
   * 
   * @param {String} path
   * @param {String} id
   * @param {Object} data
   * @param {Object} query
   * e.g query -> { $select: ['userName', 'userType'] }
   * @return {Object}
   */
  async patchItem(path = '', id = '', data = {}, query = {}) {
    return await patchItem(this.app, path, id, data, query);
  }

  /**
   * Patch items
   * @async
   * 
   * @param {String} path
   * @param {Object} data
   * @param {Object} query
   * @return {Object[]}
   */
  async patchItems(path = '', data = {}, query = {}) {
    return await patchItems(this.app, path, data, query);
  }


  /**
   * Create item
   * @async
   * 
   * @param {String} path
   * @param {Object} data
   * @param {Object} query
   * e.g query -> { $select: ['userName', 'userType'] }
   * @return {Object}
   */
  async createItem(path = '', data = {}, query = {}) {
    return await createItem(this.app, path, data, query);
  }

  /**
   * Create items
   * @async
   * 
   * @param {String} path
   * @param {Object[]} data
   * @param {Object} query
   * e.g query -> { $select: ['userName', 'userType'] }
   * @return {Object[]}
   */
  async createItems(path = '', data = [], query = {}) {
    return await createItems(this.app, path, data, query);
  }
}

module.exports = HookHelper;
