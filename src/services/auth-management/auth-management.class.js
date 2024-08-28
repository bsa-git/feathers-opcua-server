/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const authManagement = require('feathers-authentication-management');
const notifier = require('./notifier');

const debug = require('debug')('app:mssql-datasets.class');
const isDebug = false;

//===============================================================

class AuthManagement {

  setup(app, path) {
    this.app = app;
    this.app.configure(authManagement(notifier(this.app)));
    this.authManagement = this.app.service('authManagement');
    if(isDebug) debug('service initialized');
  }

  // Create authManagement
  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    if(!data || !data.action){
      throw new errors.BadRequest('Missing data or missing data property action (data.action)');  
    }

    if(isDebug && data.action) debug('service called. action=' + data.action);
    const result = await this.authManagement.create(data);
    if(isDebug && result) inspector('app:service.auth-management.class.create.result:', result);
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
