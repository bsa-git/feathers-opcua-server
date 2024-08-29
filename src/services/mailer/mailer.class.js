/* eslint-disable no-unused-vars */
const feathersMailer = require('feathers-mailer');
const smtpTransport = require('nodemailer-smtp-transport');
const {inspector} = require('../../plugins/lib');
const debug = require('debug')('app:service.mailer.class');
const isDebug = false;

//===============================================================

class Mailer {

  setup(app, options) {
    this.app = app;
    this.app.use('/feathers-mailer', feathersMailer(smtpTransport(options.mailer)));
    this.feathersMailer = this.app.service('feathers-mailer');
    if(true && options)debug('setup.options:', options);
  }


  // Create authManagement
  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }
    const result = await this.feathersMailer.create(data);
    if(isDebug && result) inspector('app:service.mailer.class.create.result:', result);
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

exports.Mailer = Mailer;
