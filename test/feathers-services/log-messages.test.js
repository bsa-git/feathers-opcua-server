/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { inspector } = require('../../src/plugins');

const debug = require('debug')('app:log-messages.test');
const isDebug = false;
const isLog = true;

describe('<<=== Log-Messages Service Test (log-messages.test.js) ===>>', () => {
  it('registered the service', () => {
    const service = app.service('log-messages');
    assert.ok(service, 'Registered the service');
  });

  it('creates and processes log-message, adds user information', async () => {
    
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

    // The messages service call params (with the user we just created)
    params.authenticated = true;
    params.user = owner;
    
    const _logMessage = {
      gr: 'TEST',
      pr: 10,
      name: 'TEST',
      userId: user._id,
      msg: '{"message":"Ullam eum enim incidunt unde omnis laborum voluptatum explicabo."}',
      additional: 'should be removed'
    };
    const logMessage = await app.service('log-messages').create(_logMessage, params);

    if(isLog) inspector('logMessage:', logMessage);

    assert.strictEqual(logMessage.msg, _logMessage.msg);
    // `ownerId` should be set to passed users it
    assert.strictEqual(logMessage.ownerId, owner._id);
    // `userId` should be set to passed users it
    assert.strictEqual(logMessage.userId, user._id);
    // Additional property has been removed
    assert.ok(!logMessage.additional);
    // `owner` has been populated
    assert.strictEqual(logMessage.owner.email, owner.email);
    // `user` has been populated
    assert.strictEqual(logMessage.user.email, user.email);
  });
});
