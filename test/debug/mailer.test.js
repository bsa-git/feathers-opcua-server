
/* eslint-disable no-unused-vars */
const assert = require('assert');
const errors = require('@feathersjs/errors');
const app = require('../../src/app');
const debug = require('debug')('app:mailer.test');
const isDebug = false;

const isTest = true;

/**
   * Send email
   * @param {Object} app
   * @param {Object} email
   */
async function sendEmail(app, email) {
  try {
    const mailer = app.service('mailer');
    if (isDebug && email) debug('sendEmail.email:', email);
    const result = await mailer.create(email);
    if (isDebug && result) debug('sendEmail.result:', result);
    return result;
  } catch (err) {
    if (true && err) debug('sendEmail.error:', err.message);
    new errors.BadRequest(`Error while sending email: ${err.message}`);
  }
}

describe('<<< Test services/mailer.test.js >>>', () => {

  if (!isTest) {
    debug('<<< Test services/mailer.test.js - NOT >>>');
    return;
  }

  it('Registered the mailer service', async () => {
    let result;
    //--------------------------------------
    const service = app.service('mailer');
    assert.ok(service, 'Registered the service');
  });

  it('Mailer.get service', async () => {
    let result;
    //--------------------------------------
    const service = app.service('mailer');
    result = await service.get('mailerID');
    if (isDebug && result) debug('service.get.result:', result);
    assert.ok(result, 'service.get.result:', result);
  });

  it('Mailer.create service', async () => {
    let result;
    //--------------------------------------
    const email = {
      senderId: '60af3870270f24162c049c09',
      from: process.env.FROM_EMAIL,
      to: 'bs261257@gmail.com',
      subject: 'Verify SignUp',
      html: '<p>Hellow</p>'
    };
    
    result = await sendEmail(app, email);
    if (true && result) debug('service.create.result:', result);
    assert.ok(result, 'service.get.result:', result);
  });
});
