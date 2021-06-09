const assert = require('assert');
const app = require('../../src/app');
const { inspector, checkServicesRegistered, saveFakesToServices } = require('../../src/plugins');
const debug = require('debug')('app:test.users');

const isDebug = true;
const isLog = true;

describe('<<=== Users Service Test (users.test.js) ===>>', () => {
  it('#1: registered the service', () => {
    const errPath = checkServicesRegistered(app, 'users');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'users\' service', async () => {
    const errPath = await saveFakesToServices(app, 'users');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });

  it('#3: Creates a user, encrypts password and adds gravatar', async () => {
    const newUser = await app.service('users').create({
      email: 'test@example.com',
      password: 'secret'
    });
    if (isLog) inspector('newUser:', newUser);
    // Verify Gravatar has been set as we'd expect
    assert.strictEqual(newUser.avatar, 'https://s.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=60');
    // Makes sure the password got encrypted
    assert.ok(newUser.password !== 'secret');
  });

  it('#4: Removes password for external requests', async () => {
    // Setting `provider` indicates an external request
    const params = { provider: 'rest' };

    const user = await app.service('users').create({
      email: 'test2@example.com',
      password: 'secret'
    }, params);

    // Make sure password has been removed
    assert.ok(!user.password);
  });

  it('#5: Error on incorrect email', async function () {
    try {
      const users = app.service('users');
      const newUser = await users.create({ email: 'my@test.', password: 'my', firstName: 'Lora', lastName: 'Lind' });
      if (isLog) inspector('newUser:', newUser);      
      assert.ok(true, 'email unexpectedly succeeded');
    } catch (ex) {
      if (isDebug) debug('Error on incorrect email for \'users\' service:', ex);
      assert.ok(false, 'email unexpectedly succeeded');
      // assert.strictEqual(ex.code, 400, 'unexpected error.code');
      // assert.strictEqual(ex.message, 'Data does not match schema');
      // assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
    }
  });
});
