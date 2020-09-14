const assert = require('assert');
const app = require('../../src/app');
const debug = require('debug')('app:messages.test');

const isDebug = false;

describe('\'messages\' service', () => {
  it('registered the service', () => {
    const service = app.service('messages');

    assert.ok(service, 'Registered the service');
  });

  it('creates and processes message, adds user information', async () => {
    // Create a new user we can use for testing
    const user = await app.service('users').create({
      email: 'messagetest@example.com',
      password: 'supersecret'
    });

    // The messages service call params (with the user we just created)
    const params = { user };
    const message = await app.service('messages').create({
      text: 'a test',
      additional: 'should be removed'
    }, params);

    assert.strictEqual(message.text, 'a test');
    // `userId` should be set to passed users it
    assert.strictEqual(message.userId, user._id);
    // Additional property has been removed
    assert.ok(!message.additional);
    // `user` has been populated
    if(isDebug) debug('message.user:', message.user);
    if(isDebug) debug('user:', user);
    assert.deepStrictEqual(message.user, user);
  });
});
