/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { checkContext, getItems } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const crypto = require('crypto');
const { inspector, readJsonFileSync, stripSpecific, isTrue, appRoot } = require('../lib');
const typeOf = require('../lib/type-of');
const debug = require('debug')('app:plugins.auth-server.class');

const isLog = false;
const isDebug = false;

/**
 * Get items from env. config
 * @param value
 * return {Array}
 */
const getEnvItems = (value) => {
  return stripSpecific(value, ';').split(';').map(item => item.trim());
};

// Get fake data
const fakeData = readJsonFileSync(`${appRoot}/seeds/fake-data.json`);

// Get feathers-specs
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};


class AuthServer {
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
    // eslint-disable-next-line no-unused-vars
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
    // Get role name
    this.roleName = this.contextParams && this.contextParams.payload ? this.contextParams.payload.role : '';
  }

  /**
   * Is mask
   * @param mask // 'authentication.create.after'
   * @return {Boolean}
   */
  isMask(mask = '') {
    const maskItems = mask.split('.');
    return (maskItems[0] === this.contextPath) && (maskItems[1] === this.contextMethod) && (maskItems[2] === this.contextType);
  }

  /**
   * isAuth
   * @return {boolean}
   */
  isAuth() {
    return !!this.contextAuthenticated;
  }

  /**
   * Get auth user
   * @return {Object|null}
   */
  getAuthUser() {
    return this.isAuth() ? this.contextUser : null;
  }

  /**
   * Get my role
   * @param {String} id
   * @return {Object}
   */
  async getRole(id) {
    const role = await this.app.service('roles').get(id);
    if (isLog) inspector('AuthServer.getRole:', role);
    return role;
  }

  /**
   * Get role name
   * @return {String}
   */
  async getRoleName() {
    if (!this.roleName) {
      const user = this.getAuthUser();
      const myRole = (this.isAuth() && user) ? await this.getRole(user.roleId) : null;
      this.roleName = myRole ? myRole.name : '';
    }
    return this.roleName;
  }

  /**
   * Get roleId
   * @param {String} alias
   * e.g. isAdministrator
   * @return {String}
   */
  async getRoleId(alias = '') {
    let roleId = '';
    const service = this.app.service('roles');
    if (service) {
      const roleName = AuthServer.getRoles(alias);
      let findResults = await service.find({ query: { name: roleName } });
      findResults = findResults.data;
      if (findResults.length) {
        let idField = 'id' in findResults[0] ? 'id' : '_id';
        roleId = findResults[0][idField].toString();
      }
      return roleId;
    } else {
      throw new errors.BadRequest('There is no service for the path - "roles"');
    }
  }

  /**
   * isAdmin
   * @return {boolean}
   */
  async isAdmin() {
    const roleName = await this.getRoleName();
    return roleName === AuthServer.getRoles('isAdministrator');
  }

  /**
   * Is jwt authentication
   * @return {boolean}
   */
  isJwtAuthentication() {
    if (this.isAuth()) return false;
    // Get generated services
    let services = feathersSpecs.services;
    const serviceNames = Object.keys(services);
    const isServiceName = serviceNames.indexOf(this.contextPath) >= 0;
    if (isServiceName) {
      const service = services[this.contextPath];
      const serviceMethods = service['overriddenAuth'];
      const isRequiresAuth = service['requiresAuth'];
      const isAuthForMethod = serviceMethods ? serviceMethods[this.contextMethod] !== 'noauth' : false;
      return isRequiresAuth && isAuthForMethod;
    }
    return false;
  }

  async jwtAuthentication(context) {
    if (isDebug) debug('AuthServer.jwtAuthentication: Start');
    await authenticate('jwt')(context);
  }

  /**
   * Is access right for service methods
   * @return Boolean
   */
  async isAccess() {

    // Run jwt authentication
    if (!AuthServer.isTest() && this.isJwtAuthentication()) {
      await this.jwtAuthentication(this.context);
    }
    // Run check
    const publicServices = AuthServer.listServices(process.env.PUBLIC_SERVICES);
    const adminServices = AuthServer.listServices(process.env.ADMIN_SERVICES);
    const isPublicAccess = !!publicServices[this.contextPath] && publicServices[this.contextPath].includes(this.contextMethod);
    const isAdminAccess = !!adminServices[this.contextPath] && adminServices[this.contextPath].includes(this.contextMethod);

    const isAdmin = await this.isAdmin();
    const notAccess = (!!this.contextProvider && !this.isAuth() && !isPublicAccess) ||
      (!!this.contextProvider && this.isAuth() && !isAdmin && isAdminAccess);

    // --- DEBUG ---
    const myRole = await this.getRoleName();
    const msg1 = `<<AuthServer>>: Provider: ${this.contextProvider ? this.contextProvider : 'Not'}; ${this.contextType} app.service('${this.contextPath}').${this.contextMethod}()`;
    const msg2 = `; isAuth: ${this.isAuth() ? this.isAuth() : 'Not'}; MyRole: ${myRole ? myRole : 'Not'};`;
    // if (isDebug) debug(`${msg1}${this.contextProvider ? msg2 : ''}`);
    if (isLog) inspector('AuthServer.contextProvider:', `${msg1}${this.contextProvider ? msg2 : ''}`);
    if (isLog) inspector('AuthServer.context:', this.getHookContext());
    if (isLog) inspector('AuthServer.isAccess:', !notAccess);
    // if (isDebug) debug(`AuthServer.isAccess: ${!notAccess}`);

    return !notAccess;
  }

  /**
   * Is login
   * Checks the ability to log user
   * @return {Promise.<void>}
   */
  async isLogin() {
    let payload = this.contextPayload;
    if (!payload) {
      payload = await AuthServer.verifyJWT(this.contextAccessToken);
    }
    if (!payload) {
      throw new errors.BadRequest('There is no payload');
    }
    const service = this.app.service('users');
    if (service) {
      const user = await service.get(payload.userId);
      if (isLog) inspector('plugins::auth-server.class::isLogin.user:', user);
      return Promise.resolve(user.active);
    } else {
      throw new errors.BadRequest('There is no service for the path - "users"');
    }
  }

  /**
   * Set user loginAt
   * @return {Object}
   */
  async setLoginAt() {
    const moment = require('moment');
    let payload = this.contextPayload;
    if (!payload) {
      payload = await AuthServer.verifyJWT(this.contextAccessToken);
    }
    if (!payload) {
      throw new errors.BadRequest('There is no payload');
    }
    const service = this.app.service('users');
    if (service) {
      const dt = moment.utc().format();
      const user = await service.patch(payload.userId, { loginAt: dt });
      if (isLog) inspector('plugins::auth-server.class::setLoginAt.user:', user);
      return user;
    } else {
      throw new errors.BadRequest('There is no service for the path - "users"');
    }
  }

  /**
   * getHookContext
   * @returns {Object}
   */
  getHookContext() {
    let target = {};
    let { path, method, type, params, id, data, result, /*dispatch,*/ statusCode, grapql } = this.context;

    if (path) target.path = path;
    if (method) target.method = method;
    if (type) target.type = type;
    if (params) {
      if (params.connection) {
        delete params.connection;
      }
      target.params = params;
    }
    if (id) target.id = id;
    if (data && type === 'before') target.data = data;
    if (result) target.result = result;
    // if (dispatch) target.dispatch = dispatch;
    if (statusCode) target.statusCode = statusCode;
    // if (error) target.error = error;
    if (grapql) target.grapql = grapql;
    return Object.assign({}, target);
  }

  /**
   * getJWT
   * Get a jwt token with appClient.passwort.
   * @async
   * @param {Object} passport
   * @return {String}
   */
  static async getPassportJWT(passport) {
    if (!passport) new Error('No passport!');
    if(passport.passport) passport = passport.passport;
    return await passport.getJWT();
  }

  /**
  * verifyPassportJWT
  * Verify a jwt token with appClient.passwort.
  * @async
  * @param {Object} passport
  * @param {String} jwt
  * @return {Object}
  */
  static async verifyPassportJWT(passport, jwt) {
    if (!passport) new Error('No passport!');
    if(!jwt) new Error('No jwt!');
    if(passport.passport) passport = passport.passport;
    return await passport.verifyJWT(jwt);
  }

  /**
   * isPassportPayloadValid
   * Verify a payload token with appClient.passwort.
   * @async
   * @param {Object} passport
   * @param {String} jwt
   * @return {Boolean}
   */
  static async isPassportPayloadValid(passport, jwt) {
    if(!passport) new Error('No passport!');
    if(!jwt) new Error('No jwt!');
    if(passport.passport) passport = passport.passport;
    return await passport.payloadIsValid(jwt);
  }

  /**
   * isLoginJWT
   * Is a jwt login with appClient.passwort.
   * @async
   * @param {Object} passport
   * @return {Boollean}
   */
  static async isLoginJWT(passport) {
    if (!passport) new Error('No passport!');
    if(passport.passport) passport = passport.passport;
    const jwt = await passport.getJWT();
    return !!jwt;
  }

  /**
   * verifyJWT
   * Pass a jwt token, get back a payload if it's valid.
   *
   * @param {String} token
   * @return {Object}
   */
  static async verifyJWT(token) {
    const decode = require('jwt-decode');
    //-----------------------------------
    const payloadIsValid = function payloadIsValid(payload) {
      return payload && (!payload.exp || payload.exp * 1000 > new Date().getTime());
    };
    if (!typeOf.isString(token)) {
      return Promise.reject(new Error('Token provided to verifyJWT is missing or not a string'));
    }
    try {
      let payload = decode(token);

      if (payloadIsValid(payload)) {
        return Promise.resolve(payload);
      }
      return Promise.reject(new Error('Invalid token: expired'));
    } catch (error) {
      return Promise.reject(new Error('Cannot decode malformed token.'));
    }
  }

  /**
   * Get list services
   * e.g. { users: ['create'], roles: ['find', 'create', 'update', 'patch', 'remove'] }
   * @param {String} envServices
   * @return {Object}
   */
  static listServices(envServices = '') {
    const all = ['find', 'get', 'create', 'update', 'patch', 'remove'];
    const _services = {};
    const services = stripSpecific(envServices, ';').split(';').map(service => {
      const items = service.trim().split('.').map(item => item.trim());
      return { [items[0]]: items[1] === '*' ? all : stripSpecific(items[1], ',').split(',').map(item => item.trim()) };
    });
    services.forEach(service => {
      Object.assign(_services, service);
    });
    return _services;
  }

  /**
   * Get env roles
   * e.g. { isAdministrator: 'Administrator', isGuest: 'Guest', isSuperRole: 'superRole' }
   * @param isRole
   * @return {Object||String}
   */
  static getRoles(isRole = '') {
    const _roles = {};
    const envRoles = stripSpecific(process.env.ROLES, ';').split(';').map(role => {
      const items = role.trim().split(':').map(item => item.trim());
      return { [items[0]]: items[1] };
    });
    envRoles.forEach(role => {
      Object.assign(_roles, role);
    });
    return isRole ? _roles[isRole] : _roles;
  }

  /**
   * Get base env roles
   * e.g. { isAdministrator: 'Administrator', isGuest: 'Guest' }
   * @param isBaseRole
   * @return {Object||String}
   */
  static getBaseRoles(isBaseRole = '') {
    const _roles = {};
    const _baseRoles = stripSpecific(process.env.BASE_ROLES, ';').split(';').map(item => item.trim());
    const _envRoles = stripSpecific(process.env.ROLES, ';').split(';').map(role => {
      const items = role.trim().split(':').map(item => item.trim());
      return { [items[0]]: items[1] };
    });
    const filterRoles = _envRoles.filter(role => {
      const key = Object.keys(role)[0];
      return _baseRoles.indexOf(key) >= 0;
    });
    filterRoles.forEach(role => {
      Object.assign(_roles, role);
    });
    return isBaseRole ? _roles[isBaseRole] : _roles;
  }

  /**
   * Is auth manager
   * @return {boolean}
   */
  static isAuthManager() {
    return (process.env.IS_AUTH_MANAGER === undefined) ? true : isTrue(process.env.IS_AUTH_MANAGER);
  }

  /**
   * Is env role
   * @param roleName
   * @return {boolean}
   */
  static isEnvRole(roleName = '') {
    const names = Object.values(AuthServer.getRoles());
    const result = (names.indexOf(roleName) >= 0);
    return result;
  }

  /**
   * Get aliase for roleName
   * e.g. for Administrator => isAdministrator; NotEnvRole => isGuest
   * @param roleName
   * @return {String}
   */
  static getEnvAliaseForRoleName(roleName = '') {
    const envRoles = AuthServer.getRoles();
    const keys = Object.keys(envRoles);
    const result = keys.find(key => envRoles[key] === roleName);
    return result ? result : 'isGuest';
  }

  /**
   * Is base role
   * @param roleName
   * @return {boolean}
   */
  static isBaseRole(roleName = '') {
    const names = Object.values(AuthServer.getBaseRoles());
    const result = (names.indexOf(roleName) >= 0);
    return result;
  }

  /**
   * Determine if environment allows test
   * @return {boolean}
   */
  static isTest() {
    return feathersSpecs.app.envTestModeName ===  process.env.NODE_ENV;
  }

  /**
   * Is user external account
   * @param user
   * @return {boolean}
   */
  static isUserExternalAccount(user) {
    const _externalAccounts = getEnvItems(process.env.EXTERNAL_ACCOUNTS);
    const found = _externalAccounts.find(function (account) {
      const accountId = `${account}Id`;
      return (user && user[accountId]) ? !!user[accountId] : false;
    });
    return !!found;
  }

  static isContextExternalAccount(context) {
    let result = false;
    // Get the record(s) from context.data (before), context.result.data or context.result (after).
    // getItems always returns an array to simplify your processing.
    let records = getItems(context);
    if (Array.isArray(records)) {
      result = records.find(function (record) {
        return !AuthServer.isUserExternalAccount(record);
      });

    } else {
      result = AuthServer.isUserExternalAccount(records);
    }
    return !!result;
  }

  /**
   * Get fake data
   * e.g. {users: [{id: 1234, email: 'my@test.com', ...}, {id: 1235, email: 'my2@test.com', ...}], ...}
   * @return {Object}
   */
  static getFakeData() {
    return fakeData;
  }

  /**
   * Get service fields
   * @param serviceName
   * @param isId
   * @return {Array.<*>}
   */
  static serviceFields(serviceName = '', isId = false) {
    const serviceFakeData = fakeData[serviceName][0];
    const idField = 'id' in serviceFakeData ? 'id' : '_id';
    const fields = Object.keys(serviceFakeData).filter(key => isId ? true : key !== idField);
    if (isLog) debug('serviceFields.fields:', fields);
    return fields;
  }

  /**
   * Get service paths
   * @return {Array}
   */
  static getServicePaths() {
    const loKebabCase = require('lodash/kebabCase');
    const paths = Object.keys(fakeData).map(key => loKebabCase(key).toLowerCase());
    if (isDebug) debug('getServicePaths:', paths);
    return paths;
  }

  /**
   * Get fake paths
   * @return {Array}
   */
  static getFakePaths() {
    const paths = Object.keys(fakeData);
    if (isDebug) debug('getFakePaths:', paths);
    return paths;
  }

  /**
   * Get id field
   * @param items {Array || Object}
   * @return {string}
   */
  static getIdField(items) {
    let idField = '';
    if (Array.isArray(items) && items.length) {
      idField = 'id' in items[0] ? 'id' : '_id';
    }
    if (typeOf.isObject(items) && Object.keys(items).length) {
      idField = 'id' in items ? 'id' : '_id';
    }
    if (!idField) {
      throw new errors.GeneralError('Items argument is not an array or object');
    }
    return idField;
  }

}

module.exports = AuthServer;
