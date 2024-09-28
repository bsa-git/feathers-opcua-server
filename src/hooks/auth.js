const errors = require('@feathersjs/errors');
const { inspector } = require('../plugins/lib');
const { AuthServer } = require('../plugins/auth');
const { defineAbilitiesFor } = require('../services/authentication/abilities');

const debug = require('debug')('app:hooks.auth');
const isDebug = false;

/**
 * User rights check for hook
 * @param isTest
 * @return {Object}
 */
const authCheck = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    if (isTest || (!AuthServer.isTest() && authServer.contextProvider)) {
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
    if (isTest || (!AuthServer.isTest() && authServer.contextProvider)) {
      if (isDebug) debug('loginCheck: Start');
      if (authServer.isMask('authentication.create.after')) {
        const isUserActive = await authServer.isUserActive();
        if (!isUserActive) {
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
    if (isTest || (!AuthServer.isTest() && authServer.contextProvider)) {
      if (isDebug) debug('setLoginAt: Start');
      if (authServer.isMask('authentication.create.after')) {
        await authServer.setLoginAt();
      }
    }
    return context;
  };
};

/**
 * abilityExtension
 * @param isTest
 * @return {Object}
 */
const abilityExtension = function (isTest = false) {
  return async context => {
    const authServer = new AuthServer(context);
    if (isTest || (!AuthServer.isTest() && authServer.contextProvider)) {
      const { app } = context;
      const { user } = context.result;
      if (isDebug && user) debug('after.create.user:', user);
      if (!user) return context;
      // Set roleAlias for user
      if (!user.roleAlias) {
        const service = app.service('roles');
        const idField = 'id' in user ? 'id' : '_id';
        let role = await service.find({ query: { [idField]: user.roleId } });
        role = role.data;
        if (!role.length) return context;
        role = role[0];
        if (isDebug && role) debug('after.create.role:', role);
        user.roleAlias = role.alias;
      }
      // Set ability and rules properties
      const ability = defineAbilitiesFor(user);
      context.result.ability = ability;
      context.result.rules = ability.rules;
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
    const user = authServer.contextUser;
    if (_isTest && user) {
      const idField = AuthServer.getIdField(user);
      const userId = user[idField];
      let role = {};
      const roleId = user.roleId;
      if (roleId) {
        role = await authServer.app.service('roles').get(roleId);
        if (isDebug && role) inspector('Role for authorized user:', role);
      }
      // make sure params.payload exists
      context.params.payload = authServer.contextPayload || {};
      if(!context.params.payload.userId) context.params.payload.userId = userId;
      // merge in a `role` property
      Object.assign(context.params.payload, { role: `${role.name ? role.name : ''}` });
    }
    return context;
  };
};

module.exports = {
  authCheck,
  loginCheck,
  setLoginAt,
  payloadExtension,
  abilityExtension
};
