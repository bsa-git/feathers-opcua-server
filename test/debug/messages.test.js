/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { 
  inspector, 
  HookHelper,
  removeDataFromServices 
} = require('../../src/plugins');

const isLog = false;

describe('<<=== Messages Service Test (messages.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const service = app.service('messages');
    assert.ok(service, 'Registered the service');
  });

  it('#2: Server creates and processes message, adds user information', async () => {
    
    await removeDataFromServices(app, 'messages');

    await removeDataFromServices(app, 'users');
    
    // Create a new user we can use for testing
    const user = await app.service('users').create({
      email: 'messageTest@example.com',
      password: 'supersecret'
    });

    const idField = HookHelper.getIdField(user);

    // The messages service call params (with the user we just created)
    const params = { user };
    if(isLog) inspector('#2: Creates and processes message, adds user information.user:', user);

    const message = await app.service('messages').create({
      text: 'a test',
      additional: 'should be removed'
    }, params);

    if(isLog) inspector('#2: Creates and processes message, adds user information.message:', message);

    assert.strictEqual(message.text, 'a test');
    // `userId` should be set to passed users it
    assert.ok(message.userId.toString() === user[idField].toString());
    // Additional property has been removed
    assert.ok(!message.additional);
  });
});
