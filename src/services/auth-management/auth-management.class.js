/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const authManagement = require('feathers-authentication-management');
const notifier = require('./notifier');

const debug = require('debug')('app:auth-management.class');
const isDebug = false;

//===============================================================

class AuthManagement {

  setup(app, path) {}

  constructor (options, app) {
    // this.options = options || {};
    this.app = app;
    this.app.configure(authManagement(notifier(this.app)));
    this.authManagement = this.app.service('authManagement');
    if(isDebug && options)debug('constructor.options:', options);
    if(isDebug && app) debug('AuthManagement service initialized');
  }

  // Create authManagement
  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    if(!data || !data.action){
      throw new errors.BadRequest('Missing data or missing data property action (data.action)');  
    }

    if(isDebug && data.action) debug('AuthManagement service called.action=' + data.action);
    const result = await this.authManagement.create(data);
    if(isDebug && result) debug('AuthManagement.create.result:', result);
    return result;
  }

  async get(id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async find(params) {
    return [];
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return { id };
  }
}

exports.AuthManagement = AuthManagement;
