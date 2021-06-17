/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {inspector, HookHelper, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Log-Messages Service Test (log-messages.test.js) ===>>', () => {

  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'log-messages');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'log-messages\' service', async () => {
    const errPath = await saveFakesToServices(app, 'logMessages');
    const service = app.service('log-messages');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'log-messages\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });

  // it('#2: External(socketio) creates and processes log-message, not adds owner, user information', async () => {
    
  //   // Setting `provider` indicates an external request
  //   let params = { provider: 'socketio' };

  //   // Create a new owner and user we can use for testing
  //   const owner = await app.service('users').create({
  //     email: 'logMessageOwner2@example.com',
  //     password: 'supersecret'
  //   }, params);
  //   const user = await app.service('users').create({
  //     email: 'logMessageUser2@example.com',
  //     password: 'supersecret'
  //   }, params);

  //   const idField = HookHelper.getIdField(user);

  //   // The messages service call params (with the user we just created)
  //   params.authenticated = true;
  //   params.user = owner;

  //   // The messages service call params (with the user we just created)
  //   const _logMessage = {
  //     gr: 'TEST',
  //     pr: 10,
  //     name: 'TEST',
  //     userId: user[idField],
  //     msg: '{"message":"Ullam eum enim incidunt unde omnis laborum voluptatum explicabo."}',
  //     additional: 'should be removed'
  //   };
  //   const logMessage = await app.service('log-messages').create(_logMessage, params);

  //   if (isLog) inspector('logMessage:', logMessage);

  //   assert.strictEqual(logMessage.msg, _logMessage.msg);
  //   // `ownerId` should be set to passed users it
  //   assert.strictEqual(logMessage.ownerId, owner[idField]);
  //   // `userId` should be set to passed users it
  //   assert.strictEqual(logMessage.userId, user[idField]);
  //   // Additional property has been removed
  //   assert.ok(!logMessage.additional);
  //   // `owner` has been populated
  //   assert.ok(!logMessage.owner);
  //   // `user` has been populated
  //   assert.ok(!logMessage.user);
  // });
});
