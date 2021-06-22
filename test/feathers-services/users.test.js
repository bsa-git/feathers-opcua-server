/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { inspector, appRoot, readJsonFileSync, checkServicesRegistered, saveFakesToServices } = require('../../src/plugins');

const isLog = false;

// Get generated fake data
const fakes = readJsonFileSync(`${appRoot}/seeds/fake-data.json`) || {};

describe('<<=== Users Service Test (users.test.js) ===>>', () => {
  it('#1: registered the service', () => {
    const errPath = checkServicesRegistered(app, 'users');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'users\' service', async () => {
    const errPath = await saveFakesToServices(app, 'users');
    const service = app.service('users');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'users\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
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
    let params = {
      query: { email: 'test@example.com' },
      provider: 'rest',
      authenticated: true
    };
    const user = await app.service('users').find(params);
    if(isLog) inspector('Removes password for external requests.user:', user.data);

    // Make sure password has been removed
    assert.ok(!user.data.password);
  });

  it('#5: Error on incorrect email', async function () {
    try {
      const users = app.service('users');
      const newUser = await users.create({ email: 'my@test.', password: 'my', firstName: 'Lora', lastName: 'Lind' });
      if (isLog) inspector('newUser:', newUser);
      assert.ok(false, 'email unexpectedly succeeded');
    } catch (ex) {
      if (isLog) inspector('Error on incorrect email for \'users\' service:', ex.code, ex.message, ex.name);
      assert.strictEqual(ex.code, 400, 'unexpected error.code');
      assert.strictEqual(ex.message, 'Data does not match schema');
      assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
    }
  });

  it('#6: Error on unique email', async function () {
    let fake;
    try {
      fake = fakes['users'][0];
      const users = app.service('users');
      await users.create({ email: fake.email, password: 'test', firstName: 'Lora', lastName: 'Lind' });
      assert(false, 'Error on unique email - unexpectedly succeeded');
    } catch (ex) {
      if (isLog) inspector('Error on unique email for \'users\' service:', ex.message);
      assert.ok(true, 'Error on unique email');
    }
  });
});
