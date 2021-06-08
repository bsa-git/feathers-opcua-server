/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { inspector, HookHelper } = require('../../src/plugins');

const isLog = true;

describe('<<=== Log-Messages Service Test (log-messages.test.js) ===>>', () => {
  it('registered the service', () => {
    const service = app.service('log-messages');
    assert.ok(service, 'Registered the service');
  });

  it('External creates and processes log-message, adds user information', async () => {
    
    // Setting `provider` indicates an external request
    let params = { provider: 'rest' };
    
    // Create a new owner and user we can use for testing
    const owner = await app.service('users').create({
      email: 'logMessageOwner@example.com',
      password: 'supersecret'
    }, params);
    const user = await app.service('users').create({
      email: 'logMessageUser@example.com',
      password: 'supersecret'
    }, params);

    const idField = HookHelper.getIdField(user);

    // The messages service call params (with the user we just created)
    params.authenticated = true;
    params.user = owner;
    
    const _logMessage = {
      gr: 'TEST',
      pr: 10,
      name: 'TEST',
      userId: user[idField],
      msg: '{"message":"Ullam eum enim incidunt unde omnis laborum voluptatum explicabo."}',
      additional: 'should be removed'
    };
    const logMessage = await app.service('log-messages').create(_logMessage, params);

    if(isLog) inspector('logMessage:', logMessage);

    assert.strictEqual(logMessage.msg, _logMessage.msg);
    // `ownerId` should be set to passed users it
    assert.strictEqual(logMessage.ownerId, owner[idField]);
    // `userId` should be set to passed users it
    assert.strictEqual(logMessage.userId, user[idField]);
    // Additional property has been removed
    assert.ok(!logMessage.additional);
    // `owner` has been populated
    assert.strictEqual(logMessage.owner.email, owner.email);
    // `user` has been populated
    assert.strictEqual(logMessage.user.email, user.email);
  });

  it('Server creates and processes log-message, adds user information', async () => {
    
    // Setting `provider` indicates an external request
    let params = {};
    
    // Create a new owner and user we can use for testing
    const owner = await app.service('users').create({
      email: 'logMessageOwner2@example.com',
      password: 'supersecret'
    }, params);
    const user = await app.service('users').create({
      email: 'logMessageUser2@example.com',
      password: 'supersecret'
    }, params);

    const idField = HookHelper.getIdField(user);

    // The messages service call params (with the user we just created)
    const _logMessage = {
      gr: 'TEST',
      pr: 10,
      name: 'TEST',
      ownerID: owner[idField],
      userId: user[idField],
      msg: '{"message":"Ullam eum enim incidunt unde omnis laborum voluptatum explicabo."}',
      additional: 'should be removed'
    };
    const logMessage = await app.service('log-messages').create(_logMessage, params);

    if(isLog) inspector('logMessage:', logMessage);

    assert.strictEqual(logMessage.msg, _logMessage.msg);
    // `ownerId` should be set to passed users it
    assert.strictEqual(logMessage.ownerId, owner[idField]);
    // `userId` should be set to passed users it
    assert.strictEqual(logMessage.userId, user[idField]);
    // Additional property has been removed
    assert.ok(logMessage.additional);
    // `owner` has been populated
    assert.ok(!logMessage.owner);
    // `user` has been populated
    assert.ok(!logMessage.user);
  });
});
