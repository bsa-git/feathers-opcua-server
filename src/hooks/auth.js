const errors = require('@feathersjs/errors');
const {inspector} = require('../plugins/lib');
const {AuthServer} = require('../plugins/auth');
// const { authenticate } = require('@feathersjs/authentication').hooks;

const debug = require('debug')('app:hooks.auth');

const isLog = false;
const isDebug = false;

/**
 * User rights check for hook
 * @param isTest
 * @return {Object}
 */
const authCheck = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    if(isTest || (!AuthServer.isTest() && authServer.contextProvider)){
      if (isDebug) debug('authCheck: Start');
      const isAccess = await authServer.isAccess();
      if (!isAccess) {
        throw new errors.Forbidden(`Access to the service method "${authServer.contextPath}.${authServer.contextMethod}" is denied. Not enough rights`);
      }
    }
    return context;
  };
};

/**
 * Login check for hook
 * @param isTest
 * @return {Object}
 */
const loginCheck = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    if(isTest || (!AuthServer.isTest() && authServer.contextProvider)){
      if (isDebug) debug('loginCheck: Start');
      if(authServer.isMask('authentication.create.after')){
        const isLogin = await authServer.isLogin();
        if(!isLogin){
          throw new errors.Forbidden('Access to the login is denied because your account is not activated. Contact your administrator.');
        }
      }
    }
    return context;
  };
};

/**
 * Set loginAt
 * @param isTest
 * @return {Object}
 */
const setLoginAt = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    if(isTest || (!AuthServer.isTest() && authServer.contextProvider)){
      if (isDebug) debug('setLoginAt: Start');
      if(authServer.isMask('authentication.create.after')){
        await authServer.setLoginAt();
      }
    }
    return context;
  };
};

/**
 * Payload extension for hook
 * @param isTest
 * @return {Object}
 */
const payloadExtension = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    const _isTest = isTest ? true : !AuthServer.isTest();
    if (_isTest && authServer.contextUser) {
      let role = {};
      const roleId = authServer.contextUser.roleId;
      if (roleId) {
        role = await authServer.app.service('roles').get(roleId);
        if (isLog) inspector('Role for authorized user:', role);
      }
      // make sure params.payload exists
      context.params.payload = authServer.contextPayload || {};
      // merge in a `role` property
      Object.assign(context.params.payload, {role: `${role.name ? role.name : ''}`});
    }
    return context;
  };
};

module.exports = {
  authCheck,
  loginCheck,
  setLoginAt,
  payloadExtension
};
